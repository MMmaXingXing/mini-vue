// import { inject, render } from "vue";
import { h, provide, inject } from "../../lib/guide-mini-vue.esm.js";

export const Provider = {
  name: "Provider",
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
  },
  setup() {
    provide("foo", "fooVal11");
    provide("bar", "barVal");
  }
};

export const ProviderTwo = {
  name: "ProviderTwo",
  render() {
    return h("div", {}, [h("p", {}, "ProviderTwo"), h(ProviderThree)]);
  },
  setup() {}
};

export const ProviderThree = {
  name: "ProviderThree",
  render() {
    return h("div", {}, [h("p", {}, "ProviderThree"), h(Consumer)]);
  },
  setup() {}
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", "bazDefault");
    return {
      foo,
      bar
    };
  },
  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar} - ${this.baz}`);
  }
};
