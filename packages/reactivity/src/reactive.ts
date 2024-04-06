import { isObject } from "@mini-vue/shared";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

function createReactiveObject(target: any, baseHandlers, proxyMap) {
  // 如果不是对象，需要返回原来的值，并且告警
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  // 判断是否已经代理过
  if (target[ReactiveFlags.RAW]) {
    return target;
  }

  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);
  // 缓存
  proxyMap.set(target, proxy);
  return proxy;
}

export function reactive(target: any) {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

export function readonly(target: object) {
  return createReactiveObject(target, readonlyHandlers, reactiveMap);
}

export function shallowReadonly(target: object) {
  return createReactiveObject(
    target,
    shallowReadonlyHandlers,
    shallowReadonlyMap
  );
}

export function isReactive(value: object) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: object) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value: object) {
  return isReactive(value) || isReadonly(value);
}
