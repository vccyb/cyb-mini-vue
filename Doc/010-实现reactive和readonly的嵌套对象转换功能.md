## 核心逻辑

我们已经实现了 reactive 和 readonly

但是要支持嵌套

## 单元测试

```ts
// src/reactivity/tests/reactive.spec.ts

it("nested reactive", () => {
  const original = {
    nested: { foo: 1 },
    array: [{ bar: 2 }],
  };

  const observed = reactive(original);

  expect(isReactive(observed.nested)).toBe(true);
  expect(isReactive(observed.array)).toBe(true);
  expect(isReactive(observed.array[0])).toBe(true);
});
```

```ts
it("nested readonly", () => {
  const original = { foo: 1, bar: { baz: 2 } };
  const wrapped = readonly(original);

  expect(isReadonly(wrapped)).toBe(true);
  expect(isReadonly(wrapped.bar)).toBe(true);
});
```

## 代码实现

其实就是递归处理即可，如果是对象，那么递归处理

```ts
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    // 递归处理res
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}
```

其实这里需要注意的一点就是，在`get`中处理嵌套转换，我们只有在用到这个`子对象`的时候，才会将这个`子对象`  转换成响应时代理，避免了不必要的性能浪费。对比`vue2`的递归遍历`defineProperty`来说，也是一个优化的地方。
