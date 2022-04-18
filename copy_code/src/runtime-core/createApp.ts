import { render } from "./renderer";
import { createVNode } from "./vnode";

export const createApp = (rootComponent) => {
  return {
    mount(rootContainer) {
      // component --> vnode
      // 所有处理基于虚拟节点来处理
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    }
  };
};
