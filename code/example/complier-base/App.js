import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  template: `<div>hi, {{message}}</div>`,
  setup() {
    return {
      message: "mini-vue"
    };
  }
};
