import { isObject } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./shapeFlags";

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
  const { type, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    // 真实dom
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
  // 将 DOM对象挂载到 vnode 上，从而让组件实例可以访问
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  // props

  const { props } = vnode;
  for (const [key, value] of Object.entries(props)) {
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
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
  const { proxy, vnode } = instance;
  const subTree = instance.render.call(proxy);

  // subTree 可能是 Component 类型也可能是 Element 类型
  // 调用 patch 去处理 subTree
  // Element 类型则直接挂载
  patch(subTree, container);
  // subTree vnode 经过 patch 后就变成了真实的 DOM 此时 subTree.el 指向了根 DOM 元素
  // 将 subTree.el 赋值给 vnode.el 就可以在组件实例上访问到挂载的根 DOM 元素对象了
  vnode.el = subTree.el;
}
