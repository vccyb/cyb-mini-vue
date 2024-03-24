## 核心逻辑

可调度性是响应式系统非常重要的特性。首先我们要明确什么是可调度性。所谓可调度性，指的是当`trigger`  动作触发副作用函数重新执行时，有能力决定副作用函数执行的时机、次数以及方式。

有了调度函数，我们在`trigger`函数中触发副作用函数重新执行时，就可以直接调用用户传递的调度器函数，从而把控制权交给用户。

## 单元测试

```ts
// scheduler 测试
it("scheduler", () => {
  let dummy;
  let run: any;
  const scheduler = vi.fn(() => {
    run = runner;
  });
  const obj: any = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      scheduler,
    }
  );

  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);

  obj.foo++;

  expect(scheduler).toHaveBeenCalledTimes(1);
  expect(dummy).toBe(1);

  // manually run
  run();
  // should have run
  expect(dummy).toBe(2);
});
```

1. 通过  `effect`  的第二个参数给定的一个对象  `{ scheduler: () => {} }`, 属性是`scheduler`, 值是一个函数;
2. `effect`  第一次执行的时候, 还是会执行  `fn`;
3. 当响应式对象被  `set`，也就是数据  `update`  时, 如果  `scheduler`  存在, 则不会执行  `fn`, 而是执行  `scheduler`;
4. 当再次执行  `runner`  的时候, 才会再次的执行  `fn`.

## 代码实现

### effect 加上 options 参数

```ts
export function effect(fn, options: any = {}) {
  // + 直接将scheduler挂载到依赖上
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  return _effect.run.bind(_effect);
}
```

### ReactiveEffect 类，构造函数加上

```ts
class ReactiveEffect {
  private _fn: any;
  public scheduler?: any;
  // + 接收scheduler
  // + 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}
```

### 修改 track 和 trigger

track 没有啥改变的

trigger ， 主要是触发，如果有 scheduler 应该触发

```ts
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler(effect._fn);
    } else {
      effect.run();
    }
  }
}
```
