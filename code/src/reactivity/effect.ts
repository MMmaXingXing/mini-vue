class ReactiveEffect {
  private _fn: Function;
  constructor(fn: Function) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn();
  }
}

// 每一个对象里面的每一个key，都需要有一个依赖搜集的容器，即有一个容器将我们传进来的fn存进去
const targetMap = new Map();
export function track(target: any, key: any) {
  // target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = targetMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

// 基于target，key去取depsMap中的值，最后遍历所有搜集到的fn，
export function trigger(target: any, key: any) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  for (let effect of dep) {
    effect.run();
  }
}

let activeEffect: any;
export const effect = (fn: Function) => {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
};
