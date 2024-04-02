## 核心思路

实现浅层的代理

`shallowReadonly`，浅层只读，从单测也很容易看出来。一般的应用场景，可能就是用于项目的优化，避免将深层全部转为 readonly。

## 单元测试

```ts
import { isReadonly, shallowReadonly } from "../src/reactive";

describe("shallowReadonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it("should make root level properties readonly", () => {
    console.warn = jest.fn();

    const user = shallowReadonly({ age: 10 });

    user.age = 11;
    expect(console.warn).toBeCalled();
  });

  it("should NOT make nested properties readonly", () => {
    console.warn = jest.fn();

    const props = shallowReadonly({ n: { foo: 1 } });
    props.n.foo = 2;

    expect(props.n.foo).toBe(2);
    expect(console.warn).not.toBeCalled();
  });
});
```

## 代码实现 shallowReadonly

主要就是判断是否传入一个 shallow 的变量，直接返回还是递归处理

```ts
// src/reactivity/baseHandlers.ts

import { isObject, extend } from "../shared";

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    // + shallow，直接返回，深层不转响应式
    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

const shallowReadonlyGet = createGetter(true, true);

// + 其实可见shallowReadonly的set逻辑同readonly，所以从readonly那继承过来，然后改写get逻辑即可
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
```

## isProxy

```ts
// src/reactivity/tests/reactive.spec.ts

import { reactive, isReactive, isProxy } from "../reactive";

// reactive -> happy path

expect(isProxy(observed)).toBe(true);

// ============================================================
// src/reactivity/tests/readonly.spec.ts

import { readonly, isReadonly, isProxy } from "../reactive";

// readonly -> happy path

expect(isProxy(wrapped)).toBe(true);
```

Checks if an object is a proxy created by reactive or readonly

## 代码实现 isProxy

很简单

```ts
// src/reactivity/reactive.ts

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
```
