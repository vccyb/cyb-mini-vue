## 核心逻辑

首先我们还是列举一些对`effect`的简单考虑：

- `分支切换`，也就是不同条件执行不同代码，例如：三元表达式。
- 嵌套`effect`的情况，应该如何处理？
- `prop++`的情况，既读又取导致无限递归，栈溢出的情况。

## 分支切换

`分支切换`，也就是不同条件执行不同代码，例如：三元表达式。
`conditionalSpy`中存在一个三元表达式，根据`obj.run`的值不同，会执行不同的代码分支。并且当`obj.run`  的值发生变化时，分支也会随之变更，这就是所谓的分支切换。

### 单元测试

```ts
it("should discover new branches while running auto", () => {
  let dummy;
  const obj = reactive({
    prop: "value",
    run: false,
  });

  const conditionalSpy = vi.fn(() => {
    dummy = obj.run ? obj.prop : "other";
  });

  effect(conditionalSpy);

  expect(dummy).toBe("other");
  expect(conditionalSpy).toBeCalledTimes(1);

  obj.prop = "Hi";
  expect(dummy).toBe("other");
  expect(conditionalSpy).toBeCalledTimes(1);

  obj.run = true;
  expect(dummy).toBe("Hi");
  expect(conditionalSpy).toBeCalledTimes(2);

  obj.prop = "World";
  expect(dummy).toBe("World");
  expect(conditionalSpy).toBeCalledTimes(3);
});

it("should not be triggered by mutating a property, which is used in an inactive branch", () => {
  let dummy;
  const obj = reactive({
    prop: "value",
    run: true,
  });

  const conditionalSpy = vi.fn(() => {
    dummy = obj.run ? obj.prop : "other";
  });

  effect(conditionalSpy);

  expect(dummy).toBe("value");
  expect(conditionalSpy).toBeCalledTimes(1);

  obj.run = false;
  expect(dummy).toBe("other");
  expect(conditionalSpy).toBeCalledTimes(2);

  obj.prop = "value2";
  expect(dummy).toBe("other");
  expect(conditionalSpy).toBeCalledTimes(2);
});
```

这两个单元测试都很重要

### 代码实现

三元表达式切换，需要更改依赖，所以我们清除收集的依赖，重新执行函数的时候执行即可

![[Pasted image 20240407221902.png]]

```ts
// src/reactivity/effect.ts

export class ReactiveEffect {
  // ... 省略部分代码

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    shouldTrack = true;
    // + 清空依赖
    cleanupEffect(this);
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;

    return result;
  }

  // ... 省略部分代码
}
```

## 嵌套 effect 问题

关于 effect 的嵌套

`effect(parentSpy)`中嵌套了`childEffect`的情况，然后分别触发`num1`、`num2`和`num3`变化，然后观察`dummy`  的变化及`父子effect`的执行情况。

### 单侧用例

```ts
it("should allow nested effects", () => {
  const nums = reactive({ num1: 0, num2: 1, num3: 2 });
  const dummy: any = {};
  const childSpy = vi.fn(() => {
    dummy.num1 = nums.num1;
  });
  const childEffect = effect(childSpy);
  const parentSpy = vi.fn(() => {
    dummy.num2 = nums.num2;
    childEffect();
    dummy.num3 = nums.num3;
  });
  effect(parentSpy);

  expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(1);
  expect(childSpy).toHaveBeenCalledTimes(2);

  // 只触发childEffect
  nums.num1 = 4;
  expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(1);
  expect(childSpy).toHaveBeenCalledTimes(3);

  // 触发parentEffect，触发一次childEffect
  nums.num2 = 10;
  expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(2);
  expect(childSpy).toHaveBeenCalledTimes(4);
  // 触发parentEffect，触发一次childEffect
  nums.num3 = 7;
  expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
  expect(parentSpy).toHaveBeenCalledTimes(3);
  expect(childSpy).toHaveBeenCalledTimes(5);
});
```

### 代码实现

通过调试，可以看出，`depsMap`中果然只有`num1`、`num2`的依赖。

那为什么会造成这个情况呢？  
`num1`和`num2`的依赖都能收集到，那意思就是`num3`的`get`操作被触发时，没有`track`到相关的依赖。  
并且可以看到`depsMap`中连`num3`这个键都没有，那肯定就是`isTracking()`为`false`时，直接`return`掉了。

那我们再次给`parentSpy`中的`dummy.num3 = nums.num3;`这一行打上断点，调试一下看看。

分析一下过程，首先`shouldTrack`为一个全局变量。  
当`effect(parentSpy)`开始运行时，会运行`run`方法，`shouldTrack`被置为`true`；  
再当嵌套的`childEffect()`运行时，也会运行里层`_effect`的`run`方法，`shouldTrack`先被置为`true` ，进行原始依赖的运行，后被置为`false`，不允许再次收集依赖。  
当`childEffect`运行结束后，到我们断点的这一行，`shouldTrack`依旧为`false`，所以`nums3`的`track`就直接跳出了。  
但我们需要的是：`shouldTrack`应该为`true`，因为此时`父级effect`还并未执行结束。

那我们就可以用一个`lastShouldTrack`来存储上一次的`shouldTrack`，再当执行完时，恢复上一次的状态。

```ts
// src/reactivity/effect.ts

export class ReactiveEffect {
  // ... 省略部分代码

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }

    let lastShouldTrack = shouldTrack;
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    activeEffect = this;
    shouldTrack = true;
    cleanupEffect(this);
    const result = this._fn();
    // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集
    // 调用完以后就恢复上次的状态
    shouldTrack = lastShouldTrack;

    return result;
  }

  // ... 省略部分代码
}
```

解决了，发现依赖有了，但是没有更新

1. 收集到了`nums3`的依赖
2. `nums3`的依赖触发正常触发
3. `nums3`的值并未被更新

我们使用`activeEffect`这个全局变量来存储通过`effect`注册的依赖，而这么做的话，我们一次只能存储一个依赖。  
当从`外层effect`进入`里层effect`时，内层函数的执行会覆盖`activeEffect`的值，`activeEffect`的指向从`parentSpy`转向`childSpy`。  
并且，这个指向的变化是不可逆的，没办法从里向外层转。  
所以，导致`nums3`的依赖虽然收集到了，但是收集的`activeEffect`是`childSpy`，而不是`parentSpy`。

利用栈来解决

```ts
// src/reactivity/effect.ts

const effectStack: any = [];

export class ReactiveEffect {
  // ... 省略部分代码

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }

    if (!effectStack.includes(this)) {
      cleanupEffect(this);
      let lastShouldTrack = shouldTrack;
      try {
        // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
        shouldTrack = true;
        // 入栈
        effectStack.push(this);
        activeEffect = this;
        return this._fn();
      } finally {
        // 出栈
        effectStack.pop();
        // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
        // 恢复 shouldTrack 开启之前的状态
        shouldTrack = lastShouldTrack;
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  }

  // ... 省略部分代码
}
```

## 无限递归循环

### 单侧用例

```ts
it("should avoid implicit infinite recursive loops with itself", () => {
  const counter = reactive({ num: 0 });
  const counterSpy = jest.fn(() => counter.num++);
  effect(counterSpy);

  expect(counter.num).toBe(1);
  expect(counterSpy).toHaveBeenCalledTimes(1);

  counter.num = 4;
  expect(counter.num).toBe(5);
  expect(counterSpy).toHaveBeenCalledTimes(2);
});
```

## 代码实现

首先读取`counter.num`的值，这会触发`track`操作，将当前副作用函数收集到`depsMap`中，接着将其加`1`后再赋值给`counter.num` ，此时会触发`trigger`操作，即把`depsMap`中的副作用函数取出并执行。但问题是该副作用函数正在执行中，还没有执行完毕，就要开始下一次的执行。这样会导致无限递归地调用自己，于是就产生了栈溢出。

```ts
// src/reactivity/effect.ts

export function triggerEffects(dep) {
  const effects = new Set<any>();

  // + 如果trigger触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
  dep &&
    dep.forEach((effect) => {
      if (effect !== activeEffect) {
        effects.add(effect);
      }
    });

  for (const effect of effects) {
    if (effect.scheduler) {
      // ps: effect._fn 为了让scheduler能拿到原始依赖
      effect.scheduler(effect._fn);
    } else {
      effect.run();
    }
  }
}
```
