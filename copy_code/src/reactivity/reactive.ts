import { track, trigger } from "./effect";

export const reactive = (raw) => {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      // 搜集依赖
      track(target, key);
      return res;
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val);
      // 依赖处理
      trigger(target, key);
      return res;
    }
  });
};
