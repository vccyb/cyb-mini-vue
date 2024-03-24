## 核心逻辑

首先介绍一下`runner`的功能，分以下几点:

1. `effect(fn)`执行会返回一个`runner`函数；
2. 执行`runner`，相当于重新执行一遍`effect`里面传入的`fn`（原始依赖）；
3. 最后`runner`的返回值就是`fn`的返回值。

至于`runner`的作用，可以看做是对外暴露`ReactiveEffect`实例的`run`方法。

- 一方面是为了可以手动调用触发依赖；
- 另一方面，也是为了和`stop`结合使用，来手动控制响应式的生效与失效；  
   具体点就是：使用者可以手动执行`runner()`来控制`副作用函数`的生效 和 执行`stop(runner)`也就是`runner.effect.stop()`使之失效，具体`stop`的实现实现后面再说。

## 单侧

```ts
it("runner", () => {
  let foo = 10;
  const runner = effect(() => {
    foo++;
    return "f00";
  });

  expect(foo).toBe(11);
  const r = runner();
  expect(foo).toBe(12);
  expect(r).toBe("foo");
});
```

## 实现

```ts
let activeEffect;
class ReactiveEffect {
  public _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    // + 添加返回值
    return this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  // + 返回runner，注意，一定要绑定示例
  return _effect.run.bind(_effect);
}
```
