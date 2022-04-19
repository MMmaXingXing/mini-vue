import { visitNode } from "../../../../../../node_modules/typescript/lib/typescript";
import { isObject } from "../../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export const render = (vnode, container) => {
  // patch 调用patch方法
  patch(vnode, container);
};

const patch = (vnode, container) => {
  // 如何判断是不是element，
  // processElement()
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
};

const processElement = (vnode, container) => {
  // init --> update
  mountElement(vnode, container);
};

const mountElement = (vnode, container) => {
  // 这里的vnode --> element --> div
  const el = (vnode.el = document.createElement(vnode.type));

  // 子元素节点处理
  // string array
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    // vnode
    mountChildren(vnode, el);
  }

  // props参数处理
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
  // el.setAttribute("id", "root");
  // document.body.append(el);
};

// 进行深层vnode节点处理
const mountChildren = (vnode, container) => {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
};

const processComponent = (vnode, container) => {
  mountComponent(vnode, container);
};

const mountComponent = (initnalVNode, container) => {
  const instance = createComponentInstance(initnalVNode);

  setupComponent(instance);
  setupRenderEffect(instance, initnalVNode, container);
};

const setupRenderEffect = (instance, initnalVNode, container) => {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  // vnode --> patch
  // vnode --> element --> mountElement
  patch(subTree, container);

  // element --> mount
  initnalVNode.el = subTree.el;
};
