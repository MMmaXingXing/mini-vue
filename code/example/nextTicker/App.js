import {
  getCurrentInstance,
  h,
  nextTick,
  ref
} from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const instance = getCurrentInstance();

    const onClick = () => {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }

      nextTick(() => {
        console.log(instance);
      });
    };
    return {
      count,
      onClick
    };
  },
  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", {}, "count:" + this.count);
    return h("div", {}, [button, p]);
  }
};
