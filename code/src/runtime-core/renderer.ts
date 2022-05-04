import { EMPTY_OBJ } from "../../shared";
import { ShapeFlags } from "../../shared/ShapeFlags";
import { effect } from "../reactivity/effect";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./cretaeApp";
import { queueJobs } from "./schedulel";
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
    patch(null, vnode, container, null, null);
  };

  // n1 --> 老
  // n2 --> 新
  const patch = (n1, n2, container, parentComponent = null, anchor) => {
    // 如何判断是不是element，
    // processElement()
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  };

  const processText = (n1, n2, container) => {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  };

  const processFragment = (n1, n2, container, parentComponent, anchor) => {
    // Implemment
    // 将虚拟节点
    mountChildren(n2.children, container, parentComponent, anchor);
  };

  const processElement = (n1, n2, container, parentComponent, anchor) => {
    // init --> update
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  };

  const patchElement = (n1, n2, container, parentComponent, anchor) => {
    console.log("patchElement");
    console.log(n1);
    console.log(n2);
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    //

    const el = (n2.el = n1.el);
    patchChildern(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
    // props
    // children 更新对比
  };

  const patchChildern = (n1, n2, container, parentComponent, anchor) => {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // Array -> Array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  };

  const patchKeyedChildren = (
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    const isSomeVNdoeType = (n1, n2) => {
      // 根据type 和 key来判断两个节点是否一样
      return n1.type === n2.type && n1.key === n2.key;
    };

    // 从左往右找到不同节点的i的位置
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      // 判断两个节点是否一样，一样的话再次调用patch去递归来处理
      if (isSomeVNdoeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右边的处理
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNdoeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 3. 新的比老的多，创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        // 可能是多个节点
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 4. 新的比老的少
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      // 先遍历老的节点
      let s1 = i;
      let s2 = i;

      // 记录新的节点的总数量,索引+1
      const toBePatched = e2 - s2 + 1;
      //记录当前处理的总数量
      let patched = 0;
      const keyToNewIndexMap = new Map();
      // 新元素对于老元素的映射顺序
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      // 通过新组件创建映射表
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 通过老组件进行查找
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          container;
        }

        let newIndex;
        // 有key取key
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNdoeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex == undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 老组件部分为 newIndexToOldIndexMap 来创建下标值, 从0，1，2开始，且值避开0
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          patch(prevChild, c2[newIndex], container, parentComponent, null);
          // 处理完新节点自增
          patched++;
        }
      }

      // 获取最长递增子序列来处理对应d对比逻辑
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 最长递增子序列指针
      let j = increasingNewIndexSequence.length - 1;
      // 倒叙使节点稳定从而进入插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 获取即将插入的节点
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j] - 1) {
            console.log("移动位置");
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
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

  function mountElement(vnode, container, parentComponent, anchor) {
    // 这里的vnode --> element --> div
    const el = (vnode.el = hostCreateElement(vnode.type));

    // 子元素节点处理
    // string array
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // vnode
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    // props参数处理
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    // el.setAttribute("id", "root");
    // document.body.append(el);
    hostInsert(el, container, anchor);
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
  const mountChildren = (children, container, parentComponent, anchor) => {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  };

  const processComponent = (n1, n2, container, parentComponent, anchor) => {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  };

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      // 使用next来存储更新过后的节点
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      n2.vnode = n2;
    }
  };

  const mountComponent = (initnalVNode, container, parentComponent, anchor) => {
    const instance = (initnalVNode.component = createComponentInstance(
      initnalVNode,
      parentComponent
    ));

    setupComponent(instance);
    setupRenderEffect(instance, initnalVNode, container, anchor);
  };

  const setupRenderEffect = (instance, initnalVNode, container, anchor) => {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance;
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));
          // vnode --> patch
          // vnode --> element --> mountElement
          patch(null, subTree, container, instance, anchor);

          // element --> mount
          initnalVNode.el = subTree.el;
          instance.isMounted = true;
        } else {
          console.log("update");
          // 需要一个更新完成后的虚拟节点,之前的节点为vnode
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;

            updateComponentPreRender(instance, next);
          }
          const { proxy } = instance;
          const subTree = instance.render.call(proxy, proxy);
          const prevSubTree = instance.subTree;
          patch(prevSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          console.log("update - schedular");
          queueJobs(instance.update);
        }
      }
    );
  };

  const updateComponentPreRender = (instance, nextVNode) => {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
  };

  return {
    createApp: createAppAPI(render)
  };
};

const getSequence = (arr: number[]): number[] => {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
};
