import { createVNode } from "../vnode";

export const renderSlots = (slots, name, props) => {
  // 具名插槽
  const slot = slots[name];
  if (slot) {
    return createVNode("div", {}, slot(props));
  }
};
