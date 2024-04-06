## 核心思路

既然要实现相对完善的`reactive`，那自然需要考虑的多一点。

那我们大概列举一些`边缘case`的简单考虑：

- `reactive`的参数类型问题，如果传入的参数不是对象呢？
- 如果`reactive`的对象已经是一个响应式对象了呢，如何处理？也就是嵌套问题：`reactive(reactive(obj))`。
- 那自然还有另外一个类似的问题：同一个对象，分别两次调用`reactive`后拿到的响应式对象还是同一个吗？

## reactive 参数类型

### 单元测试

```ts
it("reactive params type must be object", () => {
  console.warn = jest.fn();
  // 传入的不是一个对象
  const original = reactive(1);

  expect(console.warn).toBeCalled();
  expect(original).toBe(1);
});
```

### 代码实现

`proxy`不能代理基本数据类型，所以遇到基本数据类型，我们应该直接返回原数据，并给一个提示。  
那第一步，就得判断是不是对象，而且这应该是一个工具函数，所以，封装进`shared`。

```ts
function createReactiveObject(target: any, baseHandlers) {
  // 如果不是对象，需要返回原来的值，并且告警
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  return new Proxy(target, baseHandlers);
}
```

## reactive 多层嵌套问题

### 单侧

```ts
it("observing already observed value should return same Proxy", () => {
  const original = { foo: 1 };

  const observed = reactive(original);
  const observed2 = reactive(observed);

  expect(observed2).toBe(observed);
});
```

我们只需要判断`target`是否是响应式对象，是的话，则返回`target`，否则就按正常逻辑来。

### 代码实现

仔细一看，是不是可以类比`isReactive`和`isReadonly`的实现，这样的话，那就简单了。

我们为`ReactiveFlags`增加一个枚举`RAW`，值为`__v_raw`。  
然后当嵌套时，判断`target`是否有`ReactiveFlags[RAW]`。 如果已经是响应式对象，则在`createGetter`中判断读取是否`key`为`ReactiveFlags[RAW]`，是的话，则返回`target`，中断`reactive`。 那如果不是响应式对象呢，那自然就没有这个属性，继续往下走好了。

```ts
// src/reavtivity/reactive.ts

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}

function createReactiveObject(target: any, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  if (target[ReactiveFlags.RAW]) {
    return target;
  }
  return new Proxy(target, baseHandlers);
}
```

## reactive 多次监测

当我们多次监测同一个对象时，我们拿到的应该也是同一个响应式对象。  
一方面是为了性能问题，避免多次代理造成的性能浪费；  
另一方面，也是为了避免一些由此引起的不必要的问题。

我们只需要将已经代理过的对象和对应的代理，按照原始对象`target` → 响应式对象`proxy`一对一存储即可。并且由于是弱引用，所以我们采用`WeakMap`来存储。

### 代码实现

```ts
// src/reactivity/reactive.ts

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

function createReactiveObject(target: any, baseHandlers, proxyMap) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  if (target[ReactiveFlags.RAW]) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  // + 这里解决的是reactive多层嵌套的问题
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, baseHandlers);
  // + 缓存一下已经被代理的对象
  proxyMap.set(target, proxy);
  return proxy;
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers, readonlyMap);
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    shallowReadonlyHandlers,
    shallowReadonlyMap
  );
}
```
