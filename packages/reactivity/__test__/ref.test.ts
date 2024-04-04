import { reactive } from "../src/reactive";
import { ref, isRef, unRef, proxyRefs } from "../src/ref";
import { effect } from "@mini-vue/reactivity";
describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0; // 记录次数
    effect(() => {
      calls++;
      dummy = a.value;
    });

    expect(calls).toBe(1);
    expect(dummy).toBe(1);

    a.value = 2; // 响应式测试
    expect(calls).toBe(2);
    expect(dummy).toBe(2);

    // 设置同样的值不触发响应式变化
    a.value = 2;
    expect(calls).toBe(2);
  });

  it("should make nested properties reactive", () => {
    // + 可以接收一个对象，并且也具备响应式
    const a = ref({
      count: 1,
    });
    let calls = 0;

    let dummy;
    effect(() => {
      calls++;
      dummy = a.value.count;
    });

    expect(dummy).toBe(1);
    expect(calls).toBe(1);
    a.value.count = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    a.value.count = 2;
    // 嵌套的这里还有点问题
    expect(calls).toBe(3);
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "mini-vue",
    };

    const proxyUser = proxyRefs(user);

    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("mini-vue");

    proxyUser.age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
