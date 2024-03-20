import { reactive } from "../src/reactive";
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
});
