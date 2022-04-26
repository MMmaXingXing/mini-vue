// 老的是 Array
// 新的是 Array

import { ref, h } from "../../lib/guide-mini-vue.esm.js";
const nextChildren = [h("div", {}, "C"), h("div", {}, "D")];
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

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
