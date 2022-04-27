// 老的是 Array
// 新的是 Array

import { ref, h } from "../../lib/guide-mini-vue.esm.js";
// 1. 左侧的对比
// (a,b) c
// (a,b) d e
const prevChildren = [h("div", {}, "A"), h("div", {}, "B"), h("div", {}, "C")];
const nextChildren = [
  h("div", {}, "A"),
  h("div", {}, "B"),
  h("div", {}, "C"),
  h("div", {}, "D")
];

// 2. 右侧的对比
// a (b, c)
// (a, b) d e
// const prevChildren = [h("div", {}, "A"), h("div", {}, "B"), h("div", {}, "C")];
// const nextChildren = [
//   h("div", {}, "D"),
//   h("div", {}, "E"),
//   h("div", {}, "B"),
//   h("div", {}, "C")
// ];


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
