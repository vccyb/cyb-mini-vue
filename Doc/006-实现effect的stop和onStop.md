## 核心逻辑

给 effect 返回的 runner 添加 stop 的功能

## 单元测试

```ts
it("stop", () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });

  obj.prop = 2;
  expect(dummy).toBe(2);
  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);
  runner();
  expect(dummy).toBe(3);
});
```

可以通过`stop`函数传入`runner`去停止数据的响应式，而当重新手动执行`runner`的时候，数据又会恢复响应式。

## 代码实现

```ts
export funtion stop(runner) {

}
```

通过 runner 停止当前的 effect 的响应式
-> 将收集到 effect 的 dep 删除掉 （我们不是有依赖的收集嘛，在 track 中）
`[targeMap] target -> map `
`[depMap] key -> set`
`dep []` 我们就是要在这个 dep 的依赖中删除掉当前的

### 实现 stop 的函数

先给 effect 实例去搞一个 stop 方法

```ts
class ReactiveEffect {
  private _fn: any;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {}
}
```

如何通过 runner 找到 effect 的实例

```ts
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect; // 核心

  return runner;
}
```

最后看我们的 stop 方法

```ts
export function stop(runner) {
  runner.effect.stop();
}
```

### 真正实现 effect 的 stop 方法

前面说了，关键是找到对应的依赖的 set，从中删除该 effect 即可

```ts
dep.add(activeEffect);
activeEffect.deps.push(dep);
```

反向存储一下，把每个 key 对应的副作用函数，只要是包含了当前这个 effect 的，都存储一下

删除呢？

```ts
stop() {
  this.deps.forEach(dep => {
	  dep.delete(this)
  })
}
```

### 3 优化可读性

1. 抽离 cleanupEffect 函数
   就是 stop 函数里面这段逻辑可以抽离一下

```ts
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
}
```

2. 多次调用 stop 方法呢？，其实第一次已经清理完毕了，没必要了
   多次调用`stop`时，实际上第一次已经删除了，后续调用都没有实际意义，只会引起无意义的性能浪费。 所以考虑给其一个`active`状态，当被`cleanupEffect`后，置为`false`，不再进行再次删除。

```ts
stop() {
	if(this.active) {
		cleanupEffect(this)
		this.active = false
	}
}
```

## 实现 onStop

onStop 就是，当 stop 的时候触发一个钩子

### 单元测试

```ts
it("onStop", () => {
  const obj = reactive({ prop: 1 });
  const onStop = jest.fn();
  let dummy;
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      onStop,
    }
  );

  stop(runner);
  expect(onStop).toBeCalledTimes(1);
});
```

### 代码实现

那么实现思路也就很清晰了，我们首先得在`ReactiveEffect`类中去接收这个函数，然后调用`stop`的时候，手动调用一下`onStop`即可。

```ts
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
```

stop 我们有了，记得属性定义过下

```ts
public active: Boolean = true;
public onStop?: () => void;
```

那么我们 reactiveEffect 就要接受这个函数的参数，并且去挂载

```ts
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // + 接收onStop
  _effect.onStop = options.onStop;

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}
```

## 其他的优化

我们已经从 options 中挂载到 effect 上，可以优化下

```ts
_effect.onStop = options.onStop;
```

```ts
extend(_effect, options);

// shared
export const extend = Object.assign;
```
