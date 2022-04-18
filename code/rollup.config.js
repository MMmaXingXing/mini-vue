import typescript from "@rollup/plugin-typescript";
export default {
  input: "./src/index.ts",
  output: [
    // 1. cjs -> commanjs
    // 2.ejs
    {
      format: "cjs",
      file: "lib/guide-mini-vue.cjs.js"
    },
    {
      format: "es",
      file: "lib/guide-mini-vue.esm.js"
    }
  ],

  plugins: [typescript()]
};
