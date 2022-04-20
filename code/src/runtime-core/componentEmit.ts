import { camelize, toHandlerKey } from "../../shared/index";

export const emit = (instance, event, ...args) => {
  console.log("emit", event);

  // instance.props --> event
  const { props } = instance;

  // TPP
  // 先写成一个特定的行为 --> 重构成通用的行文
  // add
  // const handler = props["onAdd"];
  // handler && handler();

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler & handler(...args);
};
