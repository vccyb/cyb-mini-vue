## 核心

既然标题是优化`stop`功能，那就意为着我们之前实现的`stop`功能是存在一定的缺陷了，或者说是不满足某些特定情况的，也就是`边缘case`。

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
  obj.prop++;
  expect(dummy).toBe(2); // error

  runner();
  expect(dummy).toBe(3);
});
```

核心原因在于 obj.prop ++
是 obj.prop = obj.prop + 1
既有 读，也有写

> 发现又触发了`get`操作，读取的是`prop`这个属性。
> 再往下走，会发现，又进入了`track`，`dep`中又被重新收集了依赖，`activeEffect.deps`又重新反向收集，所以我们之前的清空都白做了。 然后，又触发`set`，走`trigger`，执行`run`的时候，又触发了`get`，继续收集依赖，反向收集，然后`dummy`被更新成 3，所以上面实际值是 3，也就清晰了。

作者：IamZJT\_  
链接：https://juejin.cn/post/7179866542857781285  
来源：稀土掘金  
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

虽然 stop 了，但是又一次的读，又触发收集了

思路：关键在于我们如果对于一响应式变量的副作用函数进行了 stop，那么这个依赖就不应该再被收集

## 代码实现

```ts
// src/reactivity/effect.ts

let activeEffect;
let shouldTrack = false; // + 是否应该收集依赖

// * ============================== ↓ 依赖收集 track ↓ ============================== * //
// * targetMap: target -> key
const targetMap = new WeakMap();

// * target -> key -> dep
export function track(target, key) {
  // * depsMap: key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // * dep
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  if (!activeEffect) return;
  if (!shouldTrack) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}
```

那什么时候不应该去收集这个依赖呢，其实就是当我们`stop`过以后，这个依赖就不应该被收集了。

而且我们知道，`dep`收集到的依赖其实就是`activeEffect`，而`activeEffect`是在`run`的时候去赋值的。

也就是说，如果 activeEffect 的的值为鼻孔，就不应该再去收集了

```ts
// src/reactivity/effect.ts

let shouldTrack;

class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true; // 是否已经 stop 过，true 为 未stop
  onStop?: () => void;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，必然会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;

    return result;
  }

  stop() {
    // ...
  }
}
```
