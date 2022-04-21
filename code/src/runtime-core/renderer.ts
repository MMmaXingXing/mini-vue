import { visitNodes } from "../../node_modules/typescript/lib/typescript";
import { ShapeFlags } from "../../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export const render = (vnode, container) => {
  // patch 调用patch方法
  patch(vnode, container);
};

const patch = (vnode, container, parentComponent = null) => {
  // 如何判断是不是element，
  // processElement()
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
};

const processText = (vnode, container) => {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
};

const processFragment = (vnode, container, parentComponent) => {
  // Implemment
  // 将虚拟节点
  mountChildren(vnode, container, parentComponent);
};

const processElement = (vnode, container, parentComponent) => {
  // init --> update
  mountElement(vnode, container, parentComponent);
};

const mountElement = (vnode, container, parentComponent) => {
  // 这里的vnode --> element --> div
  const el = (vnode.el = document.createElement(vnode.type));

  // 子元素节点处理
  // string array
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // vnode
    mountChildren(vnode, el, parentComponent);
  }

  // props参数处理
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
  // el.setAttribute("id", "root");
  // document.body.append(el);
};

// 进行深层vnode节点处理
const mountChildren = (vnode, container, parentComponent) => {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent);
  });
};

const processComponent = (vnode, container, parentComponent) => {
  mountComponent(vnode, container, parentComponent);
};

const mountComponent = (initnalVNode, container, parentComponent) => {
  const instance = createComponentInstance(initnalVNode, parentComponent);

  setupComponent(instance);
  setupRenderEffect(instance, initnalVNode, container);
};

const setupRenderEffect = (instance, initnalVNode, container) => {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  // vnode --> patch
  // vnode --> element --> mountElement
  patch(subTree, container, instance);

  // element --> mount
  initnalVNode.el = subTree.el;
};
