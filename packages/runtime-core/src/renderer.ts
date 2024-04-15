import { isObject } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch
  patch(vnode, container);
}
/**
 * @description 能够处理 component 类型和 dom element 类型
 *
 * component 类型会递归调用 patch 继续处理
 * element 类型则会进行渲染
 */
export function patch(vnode, container) {
  const { type } = vnode;
  if (typeof type === "string") {
    // 真实dom
    processElement(vnode, container);
  } else if (isObject(type)) {
    // 处理component 类型
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountElement(vnode, container) {
  const el = document.createElement(vnode.type);
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(children, el);
  }

  // props

  const { props } = vnode;
  for (const [key, value] of Object.entries(props)) {
    el.setAttribute(key, value);
  }
  container.append(el);
}

function mountComponent(vnode, container) {
  // 根据 vnode 创建一个 component 实例
  const instance = createComponentInstance(vnode);

  // setup 组件实例
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function mountChildren(vnode, container) {
  vnode.forEach((v) => {
    patch(v, container);
  });
}

function setupRenderEffect(instance, container) {
  // const subTree = instance.render();
  const { setupState } = instance;
  const subTree = instance.render.call(setupState);

  // subTree 可能是 xxxx
  patch(subTree, container);
}
