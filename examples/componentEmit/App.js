import { h } from "../../dist/mini-vue.es.js";
import { Foo } from "./Foo.js";

export const App = {
  setup() {
    return {};
  },
  render() {
    const onAdd = (...args) => {
      console.log("onAdd", args);
    };

    const onAddValue = () => {
      console.log("onAddValue");
    };

    return h("div", {}, [h(Foo, { onAdd, onAddValue })]);
  },
};
