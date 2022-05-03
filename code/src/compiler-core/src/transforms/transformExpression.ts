import { NodeTypes } from "../ast";

// 触发时包含在插值类型中
export const transformExpression = (node) => {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
};
function processExpression(node: any) {
  node.content = "_ctx." + node.content;
  return node;
}
