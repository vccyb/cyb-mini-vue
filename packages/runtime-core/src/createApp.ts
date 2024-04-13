import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先将 rootComponent 转换为 VNode虚拟节点
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
