import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

function createReactiveObject(target: any, baseHandlers) {
  return new Proxy(target, baseHandlers);
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target: object) {
  return createReactiveObject(target, readonlyHandlers);
}

export function isReactive(value: object) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: object) {
  return !!value[ReactiveFlags.IS_READONLY];
}
