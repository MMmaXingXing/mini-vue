import { NodeTypes } from "./ast";

const enum TagType {
  START,
  END
}

export const baseParse = (content: string) => {
  // 创建一个全局的上下文对象
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
};

const parseChildren = (context) => {
  const nodes: any[] = [];

  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      console.log("parse elemet");
      node = parseElement(context);
    }
  }

  nodes.push(node);

  return nodes;
};

const parseElement = (context) => {
  // Implement
  // 1. 解析tag
  const element = parseTag(context, TagType.START);
  parseTag(context, TagType.END);
  return element;
};

const parseTag = (context, type: TagType) => {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];

  // 2. 删除处理完的代码
  advanceBy(context, match[0].length);
  console.log(context.source);
  advanceBy(context, 1);
  if (TagType.END) return;
  return {
    type: NodeTypes.ELEMENT,
    tag
  };
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
