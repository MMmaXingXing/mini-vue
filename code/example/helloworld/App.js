import { h } from "../../lib/guide-mini-vue.esm.js";

window.self = this;

export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"]
      },
      // setupState
      // this.$el
      "hi " + this.msg
      // string
      // "hi " + this.msg
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
    );
  },
  setup() {
    return {
      msg: "mini-vue"
    };
  }
};
