import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../../shared/index";

export const render = (vnode, container) => {
  // render中来调用patch方法
  patch(vnode, container);
};

export const patch = (vnode, container) => {
  // 尽行组件处理
  // 判断是component OR element
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
};

export const processElement = (vnode, container) => {
  mountElement(vnode, container);
};

export const mountElement = (vnode, container) => {
  const el = document.createElement(vnode.type);

  // 子元素处理
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }

  // 参数处理
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
};

const mountChildren = (vnode, container) => {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
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
