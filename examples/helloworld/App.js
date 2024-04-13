import { h } from "../../dist/mini-vue.es.js";
// examples/helloworld/App.js
export const App = {
  // 由于还没有实现模板编译的功能 因此先用 render 函数来替代
  render() {
    return h(
      "div",
      {
        class: ["cyan", "success"],
      },
      "hi" + this.msg
    );
  },
  setup() {
    // Composition API
    return {
      msg: "mini-vue",
    };
  },
};
