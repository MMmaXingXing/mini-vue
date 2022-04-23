import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    console.log(count);

    const onClick = () => {
      count.value++;
      console.log(count.value);
    };
    return {
      count,
      onClick
    };
  },
  render() {
    return h(
      "div",
      {
        id: "root"
      },
      [
        h("div", {}, "count:" + this.count),
        h("button", { onClick: this.onClick }, "click")
      ]
    );
  }
};
