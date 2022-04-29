// 老的是 Array
// 新的是 Array

import { ref, h } from "../../lib/guide-mini-vue.esm.js";
// 1. 左侧的对比
// (a,b) c
// (a,b) d e
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B")
//   // h("div", { key: "C" }, "C")
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D")
// ];

// 2. 右侧的对比
// a (b, c)
// (a, b) d e
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C")
// ];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C")
// ];

// 3. 新的比老的长
// 创建新的
// (a, b)
// (a, b) c
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C")
// ];

// 右侧
// (a, b)
// c (a, b)
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B")
// ];

// 4. 老的比新的长
// (a, b) c
// (a, b)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C")
// ];
// const nextChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 右侧
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C")
// ];
// const nextChildren = [h("div", { key: "B" }, "B"), h("div", { key: "C" }, "C")];

// 5. 对比中间的部分
// 删除老的（在老的里面存在，在新的里面不存在）
// a, b, (c, d), f, g
// a, b, (e, c), f, g
// d 节点在新的中是没有的，需要删除掉
// c 节点的 props 发生了变化
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G")
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G")
// ];

// a, b, (c, e, d), f, g
// a, b, (e, c), f, g
// 老节点比新的几诶单多，那么多出来的可以直接干掉（优化删除逻辑）
// c 节点的 props 发生了变化

const prevChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "C", id: "c-prev" }, "C"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G")
];
const nextChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "C", id: "c-next" }, "C"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G")
];

export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange
    };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  }
};
