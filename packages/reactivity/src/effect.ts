let activeEffect;
class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    activeEffect = this;
    this._fn = fn;
  }

  run() {
    this._fn();
  }
}

/**
 * effect 收集副作用函数的依赖
 * @param fn 收集的副作用函数
 */
export function effect(fn: Function) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

// 依赖收集的容器Map
const targetMap = new Map();

/**
 * 收集对应副作用函数依赖
 */
export function track(target: object, key: string | symbol): void {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let depSet = depsMap.get(key);
  if (!depSet) {
    depSet = new Set();
    depsMap.set(key, depSet);
  }

  // 收集依赖
  depSet.add(activeEffect);
}

/**
 * 触发对应依赖的副作用函数执行
 */
export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target);
  let depSet = depsMap.get(key);
  for (const effect of depSet) {
    effect.run();
  }
}
