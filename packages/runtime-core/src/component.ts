export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };

  return component;
}

export function setupComponent(instance) {
  // TODO

  setupStatefulComponent(instance);
}
// 设置组件状态
function setupStatefulComponent(instance) {
  const Component = instance.type;

  const { setup } = Component;

  // ctx -- context
  instance.proxy = new Proxy(
    {},
    {
      get(target, key) {
        const { setupState, vnode } = instance;
        if (key === "$el") {
          return vnode.el;
        }
        if (key in setupState) {
          return setupState[key];
        }
      },
    }
  );

  if (setup) {
    const setupResult = setup();
    // setupResult 可能是 function 也可能是 object
    // - function 则将其作为组件的 render 函数
    // - object 则注入到组件的上下文中
    handleSetupResult(instance, setupResult);
  }
}

// 处理setup的结果
function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

// 完成组件设置
function finishComponentSetup(instance) {
  const Component = instance.type;
  instance.render = Component.render;
}
