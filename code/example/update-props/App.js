import { h, ref, effect } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const propsToAttrMap = ref({
      foo: "foo",
      bar: "bar"
    });

    const onChangePropsDemo1 = () => {
      console.log(propsToAttrMap.value.foo);
      propsToAttrMap.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      propsToAttrMap.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      propsToAttrMap.value = {
        foo: "foo"
      };
    };
    return {
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      propsToAttrMap
    };
  },
  render() {
    return h(
      "div",
      {
        id: "root",
        foo: this.propsToAttrMap.foo,
        bar: this.propsToAttrMap.bar
      },
      [
        h("span", {}, this.propsToAttrMap.foo),
        h(
          "button",
          { onClick: this.onChangePropsDemo1 },
          "changeProps - 值改变了 - 修改"
        ),
        h(
          "button",
          { onClick: this.onChangePropsDemo2 },
          "changeProps - 值变成了undefined - 删除"
        ),
        h(
          "button",
          { onClick: this.onChangePropsDemo3 },
          "changeProps - key在最新的里面没有了 - 删除"
        )
      ]
    );
  }
};
