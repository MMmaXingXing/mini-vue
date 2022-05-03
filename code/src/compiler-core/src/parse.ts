import { NodeTypes } from "./ast";

const enum TagType {
  START,
  END
}

export const baseParse = (content: string) => {
  // 创建一个全局的上下文对象
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
};

const parseChildren = (context, ancestors) => {
  const nodes: any[] = [];

  while (!isEnd(context, ancestors)) {
    let node;

    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        console.log("parse elemet");
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
};

const isEnd = (context, ancestors) => {
  // 2. 结束标签
  const s = context.source;
  // 根据压栈来命中结束标签
  if (s.startsWith(`</`)) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  // 1. 内容为空
  return !s;
};

const parseText = (context) => {
  let endIndex = context.source.length;
  let endToken = ["<", "{{"];

  for (let i = 0; i < endToken.length; i++) {
    const index = context.source.indexOf(endToken[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  // 1. 取值，获取content
  const content = parseTextData(context, endIndex);
  console.log("content--------", content);

  return {
    type: NodeTypes.TEXT,
    content: content
  };
};

const parseTextData = (context, length) => {
  const content = context.source.slice(0, length);
  // 2. 推进
  advanceBy(context, length);
  return content;
};

const parseElement = (context, ancestors) => {
  // Implement
  // 1. 解析tag
  const element: any = parseTag(context, TagType.START);
  ancestors.push(element);
  // 如果有子节点则内部递归处理
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  // if (context.source) {
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.END);
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }
  // }
  return element;
};

const startsWithEndTagOpen = (source, tag) => {
  return (
    source.startsWith("</") &&
    source.slice(2, tag.length + 2).toLowerCase() === tag.toLowerCase()
  );
};

const parseTag = (context, type: TagType) => {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];

  // 2. 删除处理完的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.END) return;
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
  const rawContent = parseTextData(context, rowContentLength);
  const content = rawContent.trim();

  // 获取之后删除
  advanceBy(context, closeDelimiter.length);
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
    type: NodeTypes.ROOT,
    children
  };
};

const createParseContext = (content: string) => {
  return {
    source: content
  };
};
