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

  if (setup) {
    const setupResult = setup(instance.props);
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
