import { h, renderSlots } from "../../dist/mini-vue.es.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    console.log(this.$slots);
    const foo = h("p", {}, "foo");
    // return h("div", {}, [foo, renderSlots(this.$slots)]);
    return h("div", {}, [
      renderSlots(this.$slots, "header"),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
