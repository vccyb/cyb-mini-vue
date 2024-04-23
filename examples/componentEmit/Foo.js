import { h } from "../../dist/mini-vue.es.js";

export const Foo = {
  setup(props, { emit }) {
    const emitAdd = () => {
      // console.log("emit add");
      // emit("add", 1, 2, "3", { a: "4" });
      emit("add-value");
    };
    return {
      emitAdd,
    };
  },
  // setup() {
  //   const emitAdd = () => {
  //     console.log("emit add");
  //   };

  //   return {
  //     emitAdd,
  //   };
  // },
  render() {
    return h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "add"
    );
  },
};
