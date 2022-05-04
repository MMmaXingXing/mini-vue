import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING
} from "./runtimeHelpers";

export const generate = (ast) => {
  const context = createCodegenContext();
  const { push } = context;

  genFunctionPreamble(context, ast);
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");

  push(`function ${functionName}(${signature}){`);
  push(`return `);
  genNode(ast.codegenNode, context);
  push("}");
  return {
    code: context.code
  };
};
const genFunctionPreamble = (context, ast) => {
  const { push } = context;
  const vueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper)} } = ${vueBinging}`);
  }
  push("\n");
  push("return ");
};

const createCodegenContext = () => {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    }
  };
  return context;
};

const genNode = (node, context) => {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(context, node);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
};

const genCompoundExpression = (node, context) => {
  const { push } = context;
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
};

const genElement = (node, context) => {
  const { push, helper } = context;
  const { tag, children, props } = node;
  // const child = children[0];

  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // genNode(child, context);
  // 元素节点最顶层只会有一层，因此
  // for (let i = 0; i < children.length; i++) {
  //   // 新增复合节点类型 compound
  //   const child = children[i];
  //   genNode(child, context);
  // }
  genNodeList(genNullable([tag, props, children]), context);
  // genNode(children, context);
  push(")");
};

const genNodeList = (nodes, context) => {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }

    if (i < nodes.length - 1) {
      push(", ");
    }
  }
};

const genNullable = (args: any) => {
  return args.map((arg) => arg || "null");
};

const genExpression = (node, context) => {
  const { push } = context;
  push(`${node.content}`);
};

const genInterpolation = (node, context) => {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
};

const genText = (context, node) => {
  const { push } = context;
  push(`'${node.content}'`);
};
