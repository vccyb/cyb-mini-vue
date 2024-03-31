import { extend } from "@mini-vue/shared";
// 用于记录当前run的effect，方便track进行获取
let activeEffect: ReactiveEffect;
let shouldTrack = false; // 是否应该收集依赖
class ReactiveEffect {
  private _fn: Function;
  public deps: Array<Object> = [];
  public active: Boolean = true;
  public onStop?: () => void;
  public scheduler?: Function;

  constructor(fn: Function, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    // 已经被stop，这里就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，必然会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;
    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

/**
 * 清除该副作用函数，即所有从所有响应式对象的副作用函数的set中去除该effet
 * deps -> [set1, set2, set3, set4]
 * -> set1.clean(effect)
 * @param effect
 */
function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

export function stop(runner: any) {
  runner.effect.stop();
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

  if (!activeEffect) return;
  // 如果不应该收集依赖，就应该直接返回
  if (!shouldTrack) return;

  // 收集依赖
  // 响应式变量 -> 副作用函数
  /**
   *  targetMap weakmap [target] -> map
   *  depsMap   map     [key]  ->  set
   *  depSet    set ->  [effect1, effect2, activeEffect ...]
   * */
  depSet.add(activeEffect);

  // 副作用函数 -> 响应式对象
  /**
   * deps [] -> [set1, set2, set3]
   */
  activeEffect?.deps.push(depSet);
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
  extend(_effect, options);
  _effect.run();

  // effect 返回一个runner
  // 返回run方法作为runner方法，同时bind当前effect处理run方法中this的指向问题
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
