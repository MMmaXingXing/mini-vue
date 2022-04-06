import { extend } from "../../shared";

class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
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
};

// 每一个对象里面的每一个key，都需要有一个依赖搜集的容器，即有一个容器将我们传进来的fn存进去
const targetMap = new Map();
export const track = (target, key) => {
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

  if (!activeEffect) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
};

// 基于target，key去取depsMap中的值，最后遍历所有搜集到的fn，
export const trigger = (target, key) => {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
};

let activeEffect;
export const effect = (fn, options: any = {}) => {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // options
  // Object.assign(_effect, options);
  extend(_effect, options);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
};

export const stop = (runner) => {
  runner.effect.stop();
};
