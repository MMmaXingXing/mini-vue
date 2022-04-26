// 老的是 Text
// 新的是 Text

import { ref, h } from "../../lib/guide-mini-vue.esm.js";
const prevChildren = "oldChildren";
const nextChildren = "newChildren";

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
