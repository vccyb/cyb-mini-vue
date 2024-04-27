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
    // const foo = h(Foo, {}, h("p", {}, "default slot"));
    const foo = h(
      Foo,
      {},
      {
        header: h("p", {}, "header slot"),
        footer: h("p", {}, "footer slot"),
      }
    );
    return h("div", {}, [foo]);
  },
};
