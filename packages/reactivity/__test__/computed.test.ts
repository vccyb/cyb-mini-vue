import { reactive } from "../src/reactive";
import { computed } from "../src/computed";
describe("computed", () => {
  it("happy path", () => {
    // 特点 ref .value 缓存
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = vi.fn(() => value.foo);
    const cValue = computed(getter);
    expect(getter).not.toHaveBeenCalled();

    // 调用.value 的使用才执行
    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute again (测试缓存)
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed  不.value 不会去计算
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
