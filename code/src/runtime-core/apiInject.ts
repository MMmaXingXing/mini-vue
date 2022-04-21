import { getCurrentInstance } from "./component";

export const provide = (key, value) => {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;

    // 使用原型链改写
    const parentProvides = currentInstance.parent?.provides;
    if (provides === parentProvides) {
      // 初始化操作只在init做
      provides = currentInstance.provides = Object.create(parentProvides);
    }

    provides[key] = value;
  }
};

export const inject = (key: string, defaultValue) => {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvide = currentInstance.parent;
    if (key in parentProvide) {
      return parentProvide[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
};
