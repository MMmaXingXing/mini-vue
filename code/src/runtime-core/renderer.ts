import { visitNodes } from "../../node_modules/typescript/lib/typescript";
import { ShapeFlags } from "../../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export const render = (vnode, container) => {
  // patch 调用patch方法
  patch(vnode, container);
};

const patch = (vnode, container) => {
  // 如何判断是不是element，
  // processElement()
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
      }
      break;
  }
};

const processText = (vnode, container) => {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
};

const processFragment = (vnode, container) => {
  // Implemment
  // 将虚拟节点
  mountChildren(vnode, container);
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
