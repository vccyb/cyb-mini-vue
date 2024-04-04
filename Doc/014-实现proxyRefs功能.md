ProxyRefs, 该工具函数在[vue3](https://so.csdn.net/so/search?q=vue3&spm=1001.2101.3001.7020)中的使用场景比较多，也是很重要的一个地方，特别是在 template 模板解析中,我们的 ref 对象在 template 中使用不需要.value,这里就用到了 ProxyRefs

1. 被 proxyRefs 包裹的对象获取属性时会自动解包
2. 设置属性时不需要通过读取 .value 设置属性直接设置属性即可

## 单元测试

```ts
it("proxyRefs", () => {
  const user = {
    age: ref(10),
    name: "mini-vue",
  };

  const proxyUser = proxyRefs(user);

  expect(proxyUser.age.value).toBe(10);
  expect(proxyUser.age).toBe(10);
  expect(proxyUser.name).toBe("mini-vue");
});
```

## 代码实现

际上就是获取属性值的时候，判断一下是否是`ref`，是的话返回`.value` ，不是的话，就返回本身。转头一想，这不就是之前实现的`unRef`  吗？现在只要拦截`get`操作即可。

```ts
export function proxyRefs(objectWithRefs) {
  // * get: age (ref) -> return .value
  // * get: not ref -> return value
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
  });
}
```

## 单侧加强

```ts
proxyUser.age = 20;
expect(proxyUser.age).toBe(20);
expect(user.age.value).toBe(20);

proxyUser.age = ref(10);
expect(proxyUser.age).toBe(10);
expect(user.age.value).toBe(10);
```

当`proxyUser.age`发生变化后，可以看到处理后的对象的`age`值和原来的`user`的`age`  也发生了变化。即：一次性改了两个值，这意味着我们要拦截`set`操作。

并且，不论新设置的值是不是`ref`，都能一起改变两个值。

那接下来就来实现一下。

## 代码优化

```ts
export function proxyRefs(objectWithRefs) {
  // * get: age (ref) -> return .value
  // * get: not ref -> return value
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },

    set(target, key, value) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
```

- 如果新不是 ref 类型，那么直接改掉 oldValue(ref)的 value。
- 如果不是则直接替换成新的值返回。
