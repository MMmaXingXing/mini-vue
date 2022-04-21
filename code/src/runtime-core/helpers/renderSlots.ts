import { createVNode, Fragment } from "../vnode";

export const renderSlots = (slots, name, props) => {
  // 具名插槽
  const slot = slots[name];
  if (slot) {
    return createVNode(Fragment, {}, slot(props));
  }
};
