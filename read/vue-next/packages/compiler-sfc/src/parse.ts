import {
  NodeTypes,
  ElementNode,
  SourceLocation,
  CompilerError,
  TextModes,
  BindingMetadata
} from '@vue/compiler-core'
import * as CompilerDOM from '@vue/compiler-dom'
import { RawSourceMap, SourceMapGenerator } from 'source-map'
import { TemplateCompiler } from './compileTemplate'
import { parseCssVars } from './cssVars'
import { createCache } from './cache'
import { hmrShouldReload, ImportBinding } from './compileScript'

export interface SFCParseOptions {
  filename?: string
  sourceMap?: boolean
  sourceRoot?: string
  pad?: boolean | 'line' | 'space'
  ignoreEmpty?: boolean
  compiler?: TemplateCompiler
}

export interface SFCBlock {
  type: string
  content: string
  attrs: Record<string, string | true>
  loc: SourceLocation
  map?: RawSourceMap
  lang?: string
  src?: string
}

export interface SFCTemplateBlock extends SFCBlock {
  type: 'template'
  ast: ElementNode
}

export interface SFCScriptBlock extends SFCBlock {
  type: 'script'
  setup?: string | boolean
  bindings?: BindingMetadata
  imports?: Record<string, ImportBinding>
  /**
   * import('\@babel/types').Statement
   */
  scriptAst?: any[]
  /**
   * import('\@babel/types').Statement
   */
  scriptSetupAst?: any[]
}

export interface SFCStyleBlock extends SFCBlock {
  type: 'style'
  scoped?: boolean
  module?: string | boolean
}

export interface SFCDescriptor {
  filename: string
  source: string
  template: SFCTemplateBlock | null
  script: SFCScriptBlock | null
  scriptSetup: SFCScriptBlock | null
  styles: SFCStyleBlock[]
  customBlocks: SFCBlock[]
  cssVars: string[]
  /**
   * whether the SFC uses :slotted() modifier.
   * this is used as a compiler optimization hint.
   */
  slotted: boolean

  /**
   * compare with an existing descriptor to determine whether HMR should perform
   * a reload vs. re-render.
   *
   * Note: this comparison assumes the prev/next script are already identical,
   * and only checks the special case where <script setup lang="ts"> unused import
   * pruning result changes due to template changes.
   */
  shouldForceReload: (prevImports: Record<string, ImportBinding>) => boolean
}

export interface SFCParseResult {
  descriptor: SFCDescriptor
  errors: (CompilerError | SyntaxError)[]
}

const sourceToSFC = createCache<SFCParseResult>()

export function parse(
  source: string,
  {
    sourceMap = true,
    filename = 'anonymous.vue',
    sourceRoot = '',
    pad = false,
    ignoreEmpty = true,
    compiler = CompilerDOM
  }: SFCParseOptions = {}
): SFCParseResult {
  const sourceKey =
    source + sourceMap + filename + sourceRoot + pad + compiler.parse
  const cache = sourceToSFC.get(sourceKey)
  if (cache) {
    return cache
  }

  const descriptor: SFCDescriptor = {
    filename,
    source,
    template: null,
    script: null,
    scriptSetup: null,
    styles: [],
    customBlocks: [],
    cssVars: [],
    slotted: false,
    shouldForceReload: prevImports => hmrShouldReload(prevImports, descriptor)
  }

  const errors: (CompilerError | SyntaxError)[] = []
  const ast = compiler.parse(source, {
    // there are no components at SFC parsing level
    isNativeTag: () => true,
    // preserve all whitespaces
    isPreTag: () => true,
    getTextMode: ({ tag, props }, parent) => {
      // all top level elements except <template> are parsed as raw text
      // containers
      if (
        (!parent && tag !== 'template') ||
        // <template lang="xxx"> should also be treated as raw text
        (tag === 'template' &&
          props.some(
            p =>
              p.type === NodeTypes.ATTRIBUTE &&
              p.name === 'lang' &&
              p.value &&
              p.value.content &&
              p.value.content !== 'html'
          ))
      ) {
        return TextModes.RAWTEXT
      } else {
        return TextModes.DATA
      }
    },
    onError: e => {
      errors.push(e)
    }
  })

  ast.children.forEach(node => {
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }
    // we only want to keep the nodes that are not empty (when the tag is not a template)
    if (
      ignoreEmpty &&
      node.tag !== 'template' &&
      isEmpty(node) &&
      !hasSrc(node)
    ) {
      return
    }
    switch (node.tag) {
      case 'template':
        if (!descriptor.template) {
          const templateBlock = (descriptor.template = createBlock(
            node,
            source,
            false
          ) as SFCTemplateBlock)
          templateBlock.ast = node

          // warn against 2.x <template functional>
          if (templateBlock.attrs.functional) {
            const err = new SyntaxError(
              `<template functional> is no longer supported in Vue 3, since ` +
                `functional components no longer have significant performance ` +
                `difference from stateful ones. Just use a normal <template> ` +
                `instead.`
            ) as CompilerError
            err.loc = node.props.find(p => p.name === 'functional')!.loc
            errors.push(err)
          }
        } else {
          errors.push(createDuplicateBlockError(node))
        }
        break
      case 'script':
        const scriptBlock = createBlock(node, source, pad) as SFCScriptBlock
        const isSetup = !!scriptBlock.attrs.setup
        if (isSetup && !descriptor.scriptSetup) {
          descriptor.scriptSetup = scriptBlock
          break
        }
        if (!isSetup && !descriptor.script) {
          descriptor.script = scriptBlock
          break
        }
        errors.push(createDuplicateBlockError(node, isSetup))
        break
      case 'style':
        const styleBlock = createBlock(node, source, pad) as SFCStyleBlock
        if (styleBlock.attrs.vars) {
          errors.push(
            new SyntaxError(
              `<style vars> has been replaced by a new proposal: ` +
                `https://github.com/vuejs/rfcs/pull/231`
            )
          )
        }
        descriptor.styles.push(styleBlock)
        break
      default:
        descriptor.customBlocks.push(createBlock(node, source, pad))
        break
    }
  })

  if (descriptor.scriptSetup) {
    if (descriptor.scriptSetup.src) {
      errors.push(
        new SyntaxError(
          `<script setup> cannot use the "src" attribute because ` +
            `its syntax will be ambiguous outside of the component.`
        )
      )
      descriptor.scriptSetup = null
    }
    if (descriptor.script && descriptor.script.src) {
      errors.push(
        new SyntaxError(
          `<script> cannot use the "src" attribute when <script setup> is ` +
            `also present because they must be processed together.`
        )
      )
      descriptor.script = null
    }
  }

  if (sourceMap) {
    const genMap = (block: SFCBlock | null) => {
      if (block && !block.src) {
        block.map = generateSourceMap(
          filename,
          source,
          block.content,
          sourceRoot,
          !pad || block.type === 'template' ? block.loc.start.line - 1 : 0
        )
      }
    }
    genMap(descriptor.template)
    genMap(descriptor.script)
    descriptor.styles.forEach(genMap)
    descriptor.customBlocks.forEach(genMap)
  }

  // parse CSS vars
  descriptor.cssVars = parseCssVars(descriptor)

  // check if the SFC uses :slotted
  const slottedRE = /(?:::v-|:)slotted\(/
  descriptor.slotted = descriptor.styles.some(
    s => s.scoped && slottedRE.test(s.content)
  )

  const result = {
    descriptor,
    errors
  }
  sourceToSFC.set(sourceKey, result)
  return result
}

function createDuplicateBlockError(
  node: ElementNode,
  isScriptSetup = false
): CompilerError {
  const err = new SyntaxError(
    `Single file component can contain only one <${node.tag}${
      isScriptSetup ? ` setup` : ``
    }> element`
  ) as CompilerError
  err.loc = node.loc
  return err
}

function createBlock(
  node: ElementNode,
  source: string,
  pad: SFCParseOptions['pad']
): SFCBlock {
  const type = node.tag
  let { start, end } = node.loc
  let content = ''
  if (node.children.length) {
    start = node.children[0].loc.start
    end = node.children[node.children.length - 1].loc.end
    content = source.slice(start.offset, end.offset)
  } else {
    const offset = node.loc.source.indexOf(`</`)
    if (offset > -1) {
      start = {
        line: start.line,
        column: start.column + offset,
        offset: start.offset + offset
      }
    }
    end = { ...start }
  }
  const loc = {
    source: content,
    start,
    end
  }
  const attrs: Record<string, string | true> = {}
  const block: SFCBlock = {
    type,
    content,
    loc,
    attrs
  }
  if (pad) {
    block.content = padContent(source, block, pad) + block.content
  }
  node.props.forEach(p => {
    if (p.type === NodeTypes.ATTRIBUTE) {
      attrs[p.name] = p.value ? p.value.content || true : true
      if (p.name === 'lang') {
        block.lang = p.value && p.value.content
      } else if (p.name === 'src') {
        block.src = p.value && p.value.content
      } else if (type === 'style') {
        if (p.name === 'scoped') {
          ;(block as SFCStyleBlock).scoped = true
        } else if (p.name === 'module') {
          ;(block as SFCStyleBlock).module = attrs[p.name]
        }
      } else if (type === 'script' && p.name === 'setup') {
        ;(block as SFCScriptBlock).setup = attrs.setup
      }
    }
  })
  return block
}

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/
const replaceRE = /./g

function generateSourceMap(
  filename: string,
  source: string,
  generated: string,
  sourceRoot: string,
  lineOffset: number
): RawSourceMap {
  const map = new SourceMapGenerator({
    file: filename.replace(/\\/g, '/'),
    sourceRoot: sourceRoot.replace(/\\/g, '/')
  })
  map.setSourceContent(filename, source)
  generated.split(splitRE).forEach((line, index) => {
    if (!emptyRE.test(line)) {
      const originalLine = index + 1 + lineOffset
      const generatedLine = index + 1
      for (let i = 0; i < line.length; i++) {
        if (!/\s/.test(line[i])) {
          map.addMapping({
            source: filename,
            original: {
              line: originalLine,
              column: i
            },
            generated: {
              line: generatedLine,
              column: i
            }
          })
        }
      }
    }
  })
  return JSON.parse(map.toString())
}

function padContent(
  content: string,
  block: SFCBlock,
  pad: SFCParseOptions['pad']
): string {
  content = content.slice(0, block.loc.start.offset)
  if (pad === 'space') {
    return content.replace(replaceRE, ' ')
  } else {
    const offset = content.split(splitRE).length
    const padChar = block.type === 'script' && !block.lang ? '//\n' : '\n'
    return Array(offset).join(padChar)
  }
}

function hasSrc(node: ElementNode) {
  return node.props.some(p => {
    if (p.type !== NodeTypes.ATTRIBUTE) {
      return false
    }
    return p.name === 'src'
  })
}

/**
 * Returns true if the node has no children
 * once the empty text nodes (trimmed content) have been filtered out.
 */
function isEmpty(node: ElementNode) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type !== NodeTypes.TEXT || child.content.trim() !== '') {
      return false
    }
  }
  return true
}
