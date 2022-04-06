import { mutableHandlers, readonlyHandlers } from "./baseHandlers";
import { track, trigger } from "./effect";

export const reactive = (raw) => {
  return createActiveObject(raw, mutableHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyHandlers);
};

const createActiveObject = (raw, baseHandler) => {
  return new Proxy(raw, baseHandler);
};
