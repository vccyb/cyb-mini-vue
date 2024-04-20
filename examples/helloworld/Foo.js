import { h } from "../../dist/mini-vue.es.js";

export const Foo = {
  setup(props) {
    // 假设props中有一个count
    console.log("props:", props);
    props.count++;
  },
  render() {
    return h("div", {}, `foo ${this.count}`);
  },
};
