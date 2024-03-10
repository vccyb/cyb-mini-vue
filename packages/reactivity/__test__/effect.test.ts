import { reactive } from "../src/reactivity";
import { effect } from "../src/effect";

describe("effect", () => {
  it("happy path", () => {
    /** 1 定义一个响应式对象 */
    const user = reactive({
      age: 10,
    });

    // get -> 收集依赖
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    // effect会默认执行一次
    expect(nextAge).toBe(11);

    // set 的时候, 触发依赖的副作用函数再次执行
    user.age++;
    expect(nextAge).toBe(12);

    user.age++;
    expect(nextAge).toBe(13);
  });

  // 测试effect要返回一个runner
  it("runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);

    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});
