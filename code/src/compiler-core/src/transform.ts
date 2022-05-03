export const transform = (root, options) => {
  const context = createTransformContext(root, options);
  // 1. 遍历 - 深度优先搜索
  traverseNode(root, context);
  // 2. 修改 text content
};

const createTransformContext = (root, options) => {
  // 创建全局上下文对象来存储我们传入的数据
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || []
  };

  return context;
};

const traverseNode = (node, context) => {
  // 实现深度优先搜索
  // 1. element
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    transform && transform(node);
  }

  traverseChildren(node, context);
};

const traverseChildren = (node, context) => {
  const children = node.children;

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
};
