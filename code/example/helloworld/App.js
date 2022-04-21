import {
  h,
  createTextVNode,
  getCurrentInstance
} from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = this;

export const App = {
  name: "App",
  render() {
    window.self = this;
    const foo = h(
      Foo,
      {
        count: 1,
        onAdd() {
          console.log("我被点击了");
        },
        onAddFoo() {
          console.log("我是onAddFoo");
        }
      },
      {
        header: ({ age }) => [
          h("p", {}, "slots 123" + age),
          createTextVNode("你好呀")
        ],
        body: () => h("p", {}, "slots boay")
      }
    );
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
      [h("div", {}, "hi " + this.msg), foo]
      // string
      // "hi " + this.msg
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
    );
  },
  setup() {
    const instance = getCurrentInstance();
    console.log("App", instance);
    return {
      msg: "mini-vue"
    };
  }
};
