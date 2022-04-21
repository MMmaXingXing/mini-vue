import { createApp } from "../../lib/guide-mini-vue.esm.js";
import { Provider } from "./App.js";

const rootContainer = document.querySelector("#app");
createApp(Provider).mount(rootContainer);
