import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = this;

export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        }
      },
      // setupState
      // this.$el
      [
        h("div", {}, "hi " + this.msg),
        h(Foo, {
          count: 1,
          onAdd() {
            console.log("我被点击了");
          },
          onAddFoo() {
            console.log("我是onAddFoo");
          }
        })
      ]
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
