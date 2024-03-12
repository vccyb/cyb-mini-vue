import { isObject, extend } from "@mini-vue/shared";
import { reactive } from "./reactive";

/**
 * 获取 不同的代理的proxy的getter
 */
function createGetter(isReadonly = false, shallow = false) {
  // 本质返回的还是 proxy中的getter
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);

    // 是否只读代理
    if (!isReadonly) {
      // TODO
    }

    // 浅层代理
    if (shallow) {
      return res;
    }

    // 如果我们代理的是一个对象，那么需要递归处理
    if (isObject(res)) {
    }

    return res;
  };
}
