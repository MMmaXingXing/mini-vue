import { reactive } from "vue";
import { isObject } from "../../shared";
import { track, trigger } from "./effect";
import { ReactiveFlags, readonly } from "./reactive";

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

    // 依赖搜集
    if (!isReadonly) track(target, key);
    return res;
  };
};

const createSetter = () => {
  return (target, key, val) => {
    const res = Reflect.set(target, key, val);
    // 触发依赖
    trigger(target, key);
    return res;
  };
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const mutableHandlers = {
  get,
  set
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`key:${key}set失败，因为target是readonly， ${target}`);
    return true;
  }
};
