import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

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
    push(`import { ${ast.helpers.map(aliasHelper)} } from ${vueBinging}`);
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
    default:
      break;
  }
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
