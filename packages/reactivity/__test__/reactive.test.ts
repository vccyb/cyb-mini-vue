import { reactive } from "../src/reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1 };
    const observed: any = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
  });
});
