import { reactive, isReactive } from "../src/reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1 };
    const observed: any = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });

  it("nested reactive", () => {
    const original = {
      nested: { foo: 1 },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);

    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  it("reactive params type must be object", () => {
    console.warn = vi.fn();
    const original = reactive(1);
    expect(console.warn).toBeCalled();
    expect(original).toBe(1);
  });

  it("observing already observed value should return the same Proxy", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    // console.log(observed.__v_raw);
    const observed2 = reactive(observed);
    expect(observed).toBe(observed2);
  });
});
