import { mutableHandlers, readonlyHandlers } from "./baseHandlers";
import { track, trigger } from "./effect";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}

const createActiveObject = (raw, baseHandler) => {
  return new Proxy(raw, baseHandler);
};

export const reactive = (raw) => {
  return createActiveObject(raw, mutableHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyHandlers);
};

export const isReactive = (value) => {
  return !!value[ReactiveFlags.IS_REACTIVE];
};

export const isReadonly = (value) => {
  return !!value[ReactiveFlags.IS_READONLY];
};
