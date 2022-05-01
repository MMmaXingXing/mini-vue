# mini-vue

从零到一实现 mini-vue3。

## reactivity

- [x] 支持 jest 环境搭建
- [x] 支持 effect & reactive 依赖搜集 & 依赖触发
- [x] 支持 effect.runner
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] 支持 eadonly
- [x] 支持 isReactive、isReadonly
- [x] 支持嵌套 reactive
- [x] 支持 shallowReadonly
- [x] 支持 isProxy
- [x] 支持 toRaw
- [x] 支持 ref
- [x] 支持 isRef、unRef
- [x] 支持 proxyRefs
- [x] 支持 computed 计算属性

## runtime-core

- [x] 初始化 Component
- [x] 支持 rollup 打包
- [x] 初始化 element 主流程
- [x] 支持 组件代理对象
- [x] 支持 shapeFlags
- [x] 支持 注册事件功能
- [x] 实现 组件 props 逻辑
- [x] 实现 组件 emit 功能
- [x] 支持 slots 功能
- [x] 支持 Fragment 和 Text 类型节点
- [x] 支持 getCurrentInstance
- [x] 支持 provide/inject

## runtime-dom

- [x] 自定义渲染器(createReader) custom renderer
- [x] 更新 element 流程搭建
- [x] 更新 element props
- [x] 更新 element children
- [x] 实现 双端对比 diff 算法
- [ ] 实现 组件更新
- [ ] 支持 nextTick

## compiler-core

- [ ] 实现 解析插值功能
- [ ] 实现 解析 element 标签
- [ ] 实现 解析 text 功能
- [ ] 实现 解析三种联合类型
- [ ] 实现 parse&有限状态机
- [ ] 实现 transform
- [ ] 实现 代码生成 string 类型
- [ ] 实现 代码生成插值类型 cmproj
- [ ] 实现 代码生成三种联合类型
- [ ] 实现 编译 template 成 render 函数

## build

```javascript
yarn build

// 测试可以使用
yarn build --watch
```

## run test

打开 example 中文件以 server 形式运行 index.html
