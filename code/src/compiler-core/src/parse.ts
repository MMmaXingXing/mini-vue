import { NodeTypes } from "./ast";

export const baseParse = (content: string) => {
  // 创建一个全局的上下文对象
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
};

const parseChildren = (context) => {
  const nodes: any[] = [];

  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }

  nodes.push(node);

  return nodes;
};

const parseInterpolation = (context) => {
  // {{message}}
  // 关键字变化点，抽取出来使程序解耦
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    closeDelimiter.length
  );

  // 前两个数据可以将前两个字符串干掉来进行一字符的推进
  advanceBy(context, openDelimiter.length);

  const rowContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rowContentLength);
  const content = rawContent.trim();

  // 获取之后删除
  advanceBy(context, rowContentLength + closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  };
};

const advanceBy = (context: any, length: number) => {
  context.source = context.source.slice(length);
};

const createRoot = (children) => {
  return {
    children
  };
};

const createParseContext = (content: string) => {
  return {
    source: content
  };
};
