import { h } from "../../dist/mini-vue.es.js";
import { Foo } from "./Foo.js";
// examples/helloworld/App.js
export const App = {
  // 由于还没有实现模板编译的功能 因此先用 render 函数来替代
  render() {
    window.self = this;
    return h(
      "div",
      {
        class: ["cyan", "success"],
        onClick() {
          console.log("click...");
        },
        onMousemove() {
          console.log("mousemove...");
        },
      },
      [
        h("p", { class: "cyan" }, "hi"),
        h("p", { class: "darkcyan" }, "chenyubo"),
        h("p", { class: "darkviolet" }, "mini-vue"),
        h("p", { class: "darkcyan" }, `setupState msg: ${this.msg}`),
        h(Foo, { count: 666 }),
      ]
    );
  },
  setup() {
    // Composition API
    return {
      msg: "mini-chenyubo-vue",
    };
  },
};
