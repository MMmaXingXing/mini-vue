import { create } from "ts-node";
import { createVNode } from "./vnode";

export const createAppAPI = (render) => {
  const createApp = (rootComponent) => {
    return {
      mount(rootContainer) {
        // 先转换为 vnode
        // component --> vnode
        // 所有逻辑操作都会基于虚拟节点来做处理

        const vnode = createVNode(rootComponent);

        render(vnode, rootContainer);
      }
    };
  };
  return createApp;
};
