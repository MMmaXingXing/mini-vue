import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd
      },
      "emitAdd"
    );
    const foo = h("p", {}, "foo: " + this.count);
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "body"),
      btn
    ]);
  },
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("emitAdd");
      emit("add");
      emit("add-foo");
    };
    return {
      emitAdd
    };
  }
};
