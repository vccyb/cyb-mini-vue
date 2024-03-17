import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

function createReactiveObject(target: any, baseHandlers) {
  return new Proxy(target, baseHandlers);
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target: object) {
  return createReactiveObject(target, readonlyHandlers);
}
