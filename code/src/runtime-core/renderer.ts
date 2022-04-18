import { createComponentInstance, setupComponent } from "./component";

export const render = (vnode, container) => {
  // patch 调用patch方法
  patch(vnode, container);
};

const patch = (vnode, container) => {
  // 如何判断是不是element，
  // processElement()
  processComponent(vnode, container);
};

const processComponent = (vnode, container) => {
  mountComponent(vnode, container);
};

const mountComponent = (vnode, container) => {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
};

const setupRenderEffect = (instance, container) => {
  const subTree = instance.render();
  // vnode --> patch
  // vnode --> element --> mountElement
  patch(subTree, container);
};
