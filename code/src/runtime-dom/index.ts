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

export const insert = (child, parent, anchor) => {
  console.log("insert-----------------------");
  parent.insertBefore(child, anchor || null);
};

export const remove = (child) => {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
};

export const setElementChildren = (el, text) => {
  el.textContent = text;
};

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementChildren
});

export const createApp = (...args) => {
  return renderer.createApp(...args);
};

// dom 层级高于core
export * from "../runtime-core";
