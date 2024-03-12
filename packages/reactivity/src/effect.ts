// 用于记录当前run的effect，方便track进行获取
let activeEffect;
class ReactiveEffect {
  private _fn: Function;
  public scheduler: Function | undefined;

  constructor(fn: Function, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}

// 依赖收集的容器Map
const targetMap = new Map();

// track 用于收集依赖，即收集响应式对象的副作用函数
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

// trigger 用于依赖相关的effect触发，修改了后重新执行副作用函数
export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target);
  let depSet = depsMap.get(key);
  for (const effect of depSet) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

/**
 * effect 收集副作用函数的依赖
 * @param fn 收集的副作用函数
 */
export function effect(fn: Function, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();

  // effect 返回一个runner
  // 返回run方法作为runner方法，同时bind当前effect处理run方法中this的指向问题
  return _effect.run.bind(_effect);
}
