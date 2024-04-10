import { isProxy, reactive } from "../src/reactive";
import { effect, stop } from "../src/effect";

describe("effect", () => {
  it("happy path", () => {
    /** 1 定义一个响应式对象 */
    const user: any = reactive({
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

    expect(isProxy(user)).toBe(true);
  });

  // 测试effect要返回一个runner
  it("should return runner when call", () => {
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

  it("stop", () => {
    let dummy;
    const obj: any = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });

    obj.prop = 2;
    expect(dummy).toBe(2);

    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    const obj: any = reactive({ prop: 1 });
    const onStop = vi.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.prop;
      },
      { onStop }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });

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
});
