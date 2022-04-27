import { EMPTY_OBJ } from "../../shared";
import { ShapeFlags } from "../../shared/ShapeFlags";
import { effect } from "../reactivity/effect";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./cretaeApp";
import { Fragment, Text } from "./vnode";

export const createRenderer = (options) => {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementChildren: hostSetElementText
  } = options;
  const render = (vnode, container) => {
    // patch 调用patch方法
    patch(null, vnode, container, null);
  };

  // n1 --> 老
  // n2 --> 新
  const patch = (n1, n2, container, parentComponent = null) => {
    // 如何判断是不是element，
    // processElement()
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  };

  const processText = (n1, n2, container) => {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  };

  const processFragment = (n1, n2, container, parentComponent) => {
    // Implemment
    // 将虚拟节点
    mountChildren(n2.children, container, parentComponent);
  };

  const processElement = (n1, n2, container, parentComponent) => {
    // init --> update
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  };

  const patchElement = (n1, n2, container, parentComponent) => {
    console.log("patchElement");
    console.log(n1);
    console.log(n2);
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    //

    const el = (n2.el = n1.el);
    patchChildern(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
    // props
    // children 更新对比
  };

  const patchChildern = (n1, n2, container, parentComponent) => {
    const prevShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;
    // 新的是text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 老children清空
        unmountChildren(n1.children);
      }
      if (c1 !== c2) {
        // 2. 设置text
        hostSetElementText(container, c2);
      }
    } else {
      // 新的是Array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 之前的清空掉
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent);
      } else {
        // Array -> Array
        patchKeyedChildren(c1, c2);
      }
    }
  };

  const patchKeyedChildren = (c1, c2, container, parentComponent) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      // 判断两个节点是否一样，一样的话再次调用patch去递归来处理
      if (isSomeVNdoeType(n1, n2)) {
        patch(n1, n2, container, parentComponent);
      }
    }
  };

  const patchProps = (el, oldProps, newProps) => {
    // 新老节点对比，来查看值是否一样，如果不一样则触发修改
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in oldProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  };

  function mountElement(vnode, container, parentComponent) {
    // 这里的vnode --> element --> div
    const el = (vnode.el = hostCreateElement(vnode.type));

    // 子元素节点处理
    // string array
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // vnode
      mountChildren(vnode.children, el, parentComponent);
    }

    // props参数处理
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    // el.setAttribute("id", "root");
    // document.body.append(el);
    hostInsert(el, container);
  }

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      // insert
      hostRemove(el);
    }
  };

  // 进行深层vnode节点处理
  const mountChildren = (children, container, parentComponent) => {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  };

  const processComponent = (n1, n2, container, parentComponent) => {
    mountComponent(n2, container, parentComponent);
  };

  const mountComponent = (initnalVNode, container, parentComponent) => {
    const instance = createComponentInstance(initnalVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initnalVNode, container);
  };

  const setupRenderEffect = (instance, initnalVNode, container) => {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        // vnode --> patch
        // vnode --> element --> mountElement
        patch(null, subTree, container, instance);

        // element --> mount
        initnalVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  };

  return {
    createApp: createAppAPI(render)
  };
};
