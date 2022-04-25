import { createRenderer } from "../runtime-core";

export const createElement = (type) => {
  console.log("createElement-----------------------");
  return document.createElement(type);
};

export function patchProp(el, key, prevProp, nextVal) {
  console.log("patchProp-----------------------");
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === null || nextVal == undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

export const insert = (el, container) => {
  console.log("insert-----------------------");
  container.append(el);
};

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert
});

export const createApp = (...args) => {
  return renderer.createApp(...args);
};

// dom 层级高于core
export * from "../runtime-core";
