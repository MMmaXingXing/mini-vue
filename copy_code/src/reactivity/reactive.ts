import { mutableHandler, readonlyHandler } from "./baseHandler";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}

export const reactive = (raw) => {
  return new Proxy(raw, mutableHandler);
};

export const readonly = (raw) => {
  return new Proxy(raw, readonlyHandler);
};

export const isReactive = (value) => {
  return !!value[ReactiveFlags.IS_REACTIVE];
};

export const isReadonly = (value) => {
  return !!value[ReactiveFlags.IS_READONLY];
};
