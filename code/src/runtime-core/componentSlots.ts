import { ShapeFlags } from "../shared/ShapeFlags";

export const initSlots = (instance, children) => {
  // 数组类型结构渲染
  // instance.slots = Array.isArray(children) ? children : [children];

  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
};

const normalizeObjectSlots = (children, slots) => {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }

  slots = slots;
};

const normalizeSlotValue = (value) => {
  return Array.isArray(value) ? value : [value];
};
