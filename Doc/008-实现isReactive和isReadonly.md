## 核心思路

实现两个函数，检查是否谁 reactive 和 readonly 创建的代理对象

## 单元测试

```ts
import { reactive, isReactive } from "../reactive";

describe("reactive", function () {
  it("happy path", function () {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(original.foo);

    // + isReactive
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });
});
```

```ts
it("happy path", () => {
  const original = { foo: 1, bar: { baz: 2 } };
  const wrapped = readonly(original);

  expect(wrapped).not.toBe(original);
  expect(wrapped.foo).toBe(1);

  // ! 不能被set
  wrapped.foo = 2;
  expect(wrapped.foo).toBe(1);

  // + isReadonly
  expect(isReadonly(wrapped)).toBe(true);
  expect(isReadonly(original)).toBe(false);
});
```

## 代码实现

### 实现 isReadonly

我们在 baseHandlers 中有传递对应的 isReadonly 的表示，这里传递出来即可

```ts
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    // + 如果读取的 key 是 is_reactive, 则返回 true
    if (key === "is_reactive") {
      return !isReadonly; // 这里的key是虚拟的，如果是这返回是否传递isReadonly
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}
```

```ts
// src/reactivity/reactive.ts

export function isReactive(value) {
  return value["is_reactive"];
}
```

但是！！！这里我们写到 get 里面，针对代理对象，普通对象都没这个处理呀

```ts
return value["is_reactive"] ?? false;
```

### 实现 isReadonly

```ts
// src/reactivity/baseHandlers.ts

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (key === "is_reactive") {
      return !isReadonly;
    } else if (key === "is_readonly") {
      // + is_readonly
      return isReadonly;
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}
```

```ts
// src/reactivity/reactive.ts

export function isReadonly(value) {
  return value["is_readonly"] ?? false;
}
```

## 代码优化

```ts
export function isReactive(value) {
  return !!value["is_reactive"];
}

export function isReadonly(value) {
  return !!value["is_readonly"];
}
```

```ts
// src/reactivity/reactive.ts

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

// + 用到之前标识的地方，相应的进行修改
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}
```

```ts
// + 改成枚举的方式
if (key === ReactiveFlags.IS_REACTIVE) {
  return !isReadonly;
} else if (key === ReactiveFlags.IS_READONLY) {
  return isReadonly;
}
```
