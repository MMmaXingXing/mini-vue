import {
  NodeTransform,
  NodeTypes,
  ElementTypes,
  ComponentNode,
  IfBranchNode
} from '@vue/compiler-core'
import { TRANSITION } from '../runtimeHelpers'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'

export const warnTransitionChildren: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ELEMENT &&
    node.tagType === ElementTypes.COMPONENT
  ) {
    const component = context.isBuiltInComponent(node.tag)
    if (component === TRANSITION) {
      return () => {
        if (node.children.length && hasMultipleChildren(node)) {
          context.onError(
            createDOMCompilerError(
              DOMErrorCodes.X_TRANSITION_INVALID_CHILDREN,
              {
                start: node.children[0].loc.start,
                end: node.children[node.children.length - 1].loc.end,
                source: ''
              }
            )
          )
        }
      }
    }
  }
}

function hasMultipleChildren(node: ComponentNode | IfBranchNode): boolean {
  // #1352 filter out potential comment nodes.
  const children = (node.children = node.children.filter(
    c =>
      c.type !== NodeTypes.COMMENT &&
      !(c.type === NodeTypes.TEXT && !c.content.trim())
  ))
  const child = children[0]
  return (
    children.length !== 1 ||
    child.type === NodeTypes.FOR ||
    (child.type === NodeTypes.IF && child.branches.some(hasMultipleChildren))
  )
}
