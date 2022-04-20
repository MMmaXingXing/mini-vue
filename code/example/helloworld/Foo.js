import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  render() {
    return h(
      "div",
      {
        id: "foo"
      },
      "foo: " + this.count
    );
  },
  setup(props) {
    // props.count
    console.log(props);
  }
};
