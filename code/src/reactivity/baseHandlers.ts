import { track, trigger } from "./effect";

const createGetter = (isReadonly = false) => {
  return (target, key) => {
    const res = Reflect.get(target, key);
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
  set(target, key, val) {
    console.warn(`key:${key}set失败，因为target是readonly， ${target}`);
    return true;
  }
};
