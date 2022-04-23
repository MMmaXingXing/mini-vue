import { isObject } from "../../shared/index";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from "./baseHandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}

export const reactive = (raw) => {
  return createActiveObject(raw, mutableHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyHandlers);
};

export const shallowReadonly = (raw) => {
  return createActiveObject(raw, shallowReadonlyHandlers);
};

export const isReactive = (value) => {
  return !!value[ReactiveFlags.IS_REACTIVE];
};

export const isReadonly = (value) => {
  return !!value[ReactiveFlags.IS_READONLY];
};

export const isProxy = (value) => {
  return isReactive(value) || isReadonly(value);
};

const createActiveObject = (target, baseHandler) => {
  if (!isObject(target)) {
    console.warn("target 必须是一个对象");
  }
  return new Proxy(target, baseHandler);
};
