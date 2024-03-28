## 核心逻辑

通过 readonly 实现的代理对象，只能读，不能写，
也就是说，只能够 get，不能够 set，所以不需要去收集依赖 track

## 单元测试

```ts
describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    // ! 不能被set
    wrapped.foo = 2;
    expect(wrapped.foo).toBe(1);
  });
});
```

## 代码实现

```ts
export function readonly(target) {
  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key);
      return res;
    },
    set(target, key, value) {
      return true;
    },
  });
}
```

## 代码优化

### 优化 1 抽取 createGetter 和 createSetter

优化 1: reactive 和 readonly 两种代理，中 get 比较相似，可以进行抽离

```ts
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}
```

这里 set 也抽象是为了代码的一致性
那么使用的时候就是

```ts
export function reactive(target) {
  return new Proxy(target, {
    get: createGetter(),
    set: createSetter(),
  });
}

export function readonly(target) {
  return new Proxy(target, {
    get: createGetter(true),
    set(target, key, value) {
      return true;
    },
  });
}
```

### 优化 2 抽离 baseHandler

new proxy 都是通用的，也可以抽离到 baseHandlers.ts 专门存放代理函数

```ts
// * reactive
export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};

// * readonly
export const readonlyHandlers = {
  get: createGetter(true),

  set(target, key, value) {
    // todo 抛出警告⚠️ 不可以被set
    return true;
  },
};
```

```ts
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(target) {
  return new Proxy(target, mutableHandlers);
}

export function readonly(target) {
  return new Proxy(target, readonlyHandlers);
}
```

### 优化 3 语义性和 全局变量优化

`reactive`和`readonly`的主要逻辑基本相同，都是对象代理，不具备一个良好的语义性。

```ts
// + src/reactivity/reactive.ts
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

function createReactiveObject(target: any, baseHandlers) {
  return new Proxy(target, baseHandlers);
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}
```

再看到`mutableHandlers`和`readonlyHandlers`，会发现，每次调用`mutableHandlers`，实际上都会重新创建`get`，所以考虑用一个全局变量存储，就不会被销毁。

```ts
// + src/reactivity/baseHandlers.ts
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// * reactive
export const mutableHandlers = {
  get,
  set,
};

// * readonly
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    // todo 抛出警告⚠️ 不可以被set
    return true;
  },
};
```

## 告警实现

```ts
it("should call console.warn when set", () => {
  // console.warn()
  // mock
  // ps: jest.fn() 用于创建一个 Mock 函数，可以设置该函数的返回值、监听该函数的调用、改变函数的内部实现等等。通过 jest.fn() 创建的函数有一个特殊的 .mock 属性，该属性保存了每一次调用情况
  console.warn = jest.fn();

  const user = readonly({ age: 10 });
  user.age = 11;

  expect(console.warn).toBeCalled();
});
```

实现：

```ts
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    // ! 抛出警告⚠️ 不可以被set
    console.warn(
      `key: ${key} set value: ${value} failed, because the target is readonly!`,
      target
    );
    return true;
  },
};
```
