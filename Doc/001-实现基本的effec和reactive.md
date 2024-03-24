# 001-实现 effect 和 reactive 依赖收集和触发依赖

## 核心逻辑

reactive 去定义响应式变量，而 effect 去收集响应式变量的依赖
然后实现依赖的自动收集和自动触发

## 1 单元测试

`effect.test.ts`

```ts
describe("effect", () => {
  it("happy path", () => {
    // 定义响应式变量
    const user = reactive({
      age: 10,
    });

    let nextAge;
    // get -> 收集依赖
    effect(() => {
      nextAge = user.age + 1;
    });
    // effect 默认会执行一次
    expect(nextAge).toBe(11);

    // set -> 触发依赖
    user.age++;
    expect(nextAge).toBe(12);
  });
});
```

`reactive.test.ts`

```ts
describe("reactive", function () {
  it("happy path", function () {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(original.foo);
  });
});
```

## 2 代码

### 实现 effect

`effect.ts`

```ts
let activeEffect;
class ReactiveEffect {
  public _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
```

### 实现 track 和 trigger

`track`

```ts
const targetMap = new WeakMap();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);
}
```

`trigger`

```ts
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
```

### 实现 reactive

```ts
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      track(target, key); // track
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      trigger(target, key); // trigger
      return res;
    },
  });
}
```
