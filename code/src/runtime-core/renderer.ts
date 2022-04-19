// import { ShapeFlags } from "../../shared/ShapeFlags";
import { ShapeFlags } from "../../../../../../node_modules/@vue/shared/dist/shared";
import { createComponentInstance, setupComponent } from "./component";

export const render = (vnode, container) => {
  // patch 调用patch方法
  patch(vnode, container);
};

const patch = (vnode, container) => {
  // 如何判断是不是element，
  // processElement()
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
