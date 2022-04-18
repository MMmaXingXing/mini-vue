import { createComponentInstance, setupComponent } from "./component";

export const render = (vnode, container) => {
  // render中来调用patch方法
  patch(vnode, container);
};

export const patch = (vnode, container) => {
  // 尽行组件处理
  // 判断是component OR element

  processComponent(vnode, container);
};

export const processComponent = (vnode, container) => {
  mountComponent(vnode, container);
};

export const mountComponent = (vnode, container) => {
  const instance = createComponentInstance(vnode);

  // 设置组件
  setupComponent(instance);
  // 掉用组件
  setupRenderEffect(instance, container);
};

const setupRenderEffect = (instance, container) => {
  // 虚拟节点树
  const subTree = instance.render();

  // vnode --> patch
  // vnode --> element --> mountElement(在patch中处理)
  patch(subTree, container);
};
