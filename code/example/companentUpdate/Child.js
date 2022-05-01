import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const Child = {
  name: "Child",
  setup(props, { emit }) {},
  render(proxy) {
    return h("div", {}, [h("div", {}, "child-props-msg " + this.$props.msg)]);
  }
};
