import { extend } from "../../shared/index";

let activeEffect;
let shouldTrack;
export class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 执行fn但是不搜集依赖
    if (!this.active) {
      return this._fn();
    }

    // 可以开始搜集依赖了
    shouldTrack = true;
    activeEffect = this;

    const result = this._fn();
    shouldTrack = false;
    return result;
  }

  stop() {
    // 性能优化，增加一个active参数
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

const cleanupEffect = (effect) => {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
};

// 每一个对象里面的每一个key，都需要有一个依赖搜集的容器，即有一个容器将我们传进来的fn存进去
const targetMap = new Map();
export const track = (target, key) => {
  if (!isTracking()) return;

  console.log(key);

  // target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
};

export const trackEffects = (dep) => {
  //  搜集依赖处理拆分为公共方法
  debugger;
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
};

export const isTracking = () => {
  return shouldTrack && activeEffect !== undefined;
};

// 基于target，key去取depsMap中的值，最后遍历所有搜集到的fn，
export const trigger = (target, key) => {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
};

export const triggerEffects = (dep) => {
  for (const effect of dep) {
    console.log(effect._fn);
    debugger;
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
};

export const effect = (fn, options: any = {}) => {
  debugger;
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // options
  // Object.assign(_effect, options);
  extend(_effect, options);
  _effect.run();

  // 用户可以自行选择事件调用effect
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
};

export const stop = (runner) => {
  runner.effect.stop();
};
