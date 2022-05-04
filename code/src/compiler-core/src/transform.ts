import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export const transform = (root, options = {}) => {
  const context = createTransformContext(root, options);
  // 1. 遍历 - 深度优先搜索
  traverseNode(root, context);
  // 2. 修改 text content

  // root.codegenNode
  createRootCodgen(root);

  root.helpers = [...context.helpers.keys()];
};

const createRootCodgen = (root) => {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
};

const createTransformContext = (root, options) => {
  // 创建全局上下文对象来存储我们传入的数据
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    }
  };

  return context;
};

const traverseNode = (node, context) => {
  // 实现深度优先搜索
  // 1. element
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    if (onExit) exitFns.push(onExit);
  }

  // 判断类型
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 判断是不是插值 balabala
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
};

const traverseChildren = (node, context) => {
  const children = node.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
};
