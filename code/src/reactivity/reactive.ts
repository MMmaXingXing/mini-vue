import { track, trigger } from "./effect";

export const reactive = (raw) => {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      // 依赖搜集
      track(target, key);
      return res;
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val);
      // 触发依赖
      trigger(target, key);
      return res;
    }
  });
};
