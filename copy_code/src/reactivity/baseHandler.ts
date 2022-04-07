import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
import { isObject } from "../../shared";

const createGetter = (isReadonly = false) => {
  return (target, key) => {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    // 搜集依赖
    track(target, key);
    return res;
  };
};

const createSetter = () => {
  return (target, key, val) => {
    const res = Reflect.set(target, key, val);
    // 依赖处理
    trigger(target, key);
    return res;
  };
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const mutableHandler = {
  get,
  set
};

export const readonlyHandler = {
  get: readonlyGet,
  set: (target, key) => {
    console.warn(`key:${key}set失败，因为target是readonly， ${target}`);
    return true;
  }
};
