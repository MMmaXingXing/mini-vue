export const App = {
  name: "App",
  template: `<div>hi, {{message}}</div>`,
  setup() {
    return {
      message: "mini-vue"
    };
  }
};
