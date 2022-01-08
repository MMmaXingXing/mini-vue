/*
Run Rollup in watch mode for development.

To specific the package to watch, simply pass its name and the desired build
formats to watch (defaults to "global"):

```
# name supports fuzzy match. will watch all packages with name containing "dom"
nr dev dom

# specify the format to output
nr dev core --formats cjs

# Can also drop all __DEV__ blocks with:
__DEV__=false nr dev
```
*/

// 运行脚本
const execa = require('execa')
//工具
const { fuzzyMatchTarget } = require('./utils')
//获取参数
const args = require('minimist')(process.argv.slice(2))
// 打包目标，打包哪些package
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'vue'
// 输出格式 cjs，esm，gloable
const formats = args.formats || args.f
// 是否添加map文件
const sourceMap = args.sourcemap || args.s
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

// 参数指定传入打开对应设置
execa(
  'rollup',
  [
    '-wc',
    '--environment',
    [
      `COMMIT:${commit}`,
      `TARGET:${target}`,
      `FORMATS:${formats || 'global'}`,
      sourceMap ? `SOURCE_MAP:true` : ``
    ]
      .filter(Boolean)
      .join(',')
  ],
  {
    stdio: 'inherit'
  }
)
