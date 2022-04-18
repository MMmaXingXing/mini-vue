import { createVNode } from "./vnode";

export const h = (type, props?, children?) => {
  return createVNode(type, props, children);
};
