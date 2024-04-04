## 核心逻辑

实现一个判断是否是 ref 的函数和解除包装获取原始值的函数

## 单元测试 isRef

```ts
it("isRef", () => {
  const a = ref(1);
  const user = reactive({
    age: 1,
  });

  expect(isRef(a)).toBe(true);
  expect(isRef(1)).toBe(false);
  expect(isRef(user)).toBe(false);
});
```

## 代码实现 isRef

```ts
class RefImpl {
  private _value: any;
  public dep;
  // 加一个标识
  public __v_isRef = true;
  constructor(value: any) {
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set();
  }

  get value() {
    if (isTracking()) {
      trackEffect(this.dep);
    }
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = newValue;
      triggerEffect(this.dep); // 触发依赖
    }
  }
}

export function isRef(ref: RefImpl) {
  return !!ref?.__v_isRef;
}
```

## 单元测试 unRef

```ts
it("unRef", () => {
  const a = ref(1);
  expect(unRef(a)).toBe(1);
  expect(unRef(1)).toBe(1);
});
```

## 代码实现 unRef

```ts
export function unRef(ref: RefImpl | any) {
  return isRef(ref) ? ref.value : ref;
}
```
