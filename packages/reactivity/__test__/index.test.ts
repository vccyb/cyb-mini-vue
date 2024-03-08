import { isObject } from "@mini-vue/shared";
console.log("isObject 调用成功", isObject(1));

describe("test ", () => {
  it("isObject 调用成功", () => {
    expect(isObject(1)).toBe(false);
  });
});
