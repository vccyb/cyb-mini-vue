import { h } from "../../dist/mini-vue.es.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    console.log(this.$slots);
    const foo = h("p", {}, "foo");
    return h("div", {}, [foo, this.$slots]);
  },
};
