import { h } from "../../dist/mini-vue.es.js";
import { Foo } from "./Foo.js";

export const App = {
  setup() {
    return {};
  },
  render() {
    // const foo = h(Foo, {}, [
    //   h("p", {}, "default slot"),
    //   h("p", {}, "plasticine"),
    // ]);
    const foo = h(Foo, {}, h("p", {}, "default slot"));
    return h("div", {}, [foo]);
  },
};
