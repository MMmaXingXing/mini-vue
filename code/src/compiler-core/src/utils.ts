import { NodeTypes } from "./ast";

export const isText = (node) => {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
};
