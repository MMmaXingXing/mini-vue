export const createComponentInstance = (vnode) => {
  const component = {
    vnode,
    type: vnode.type
  };
  return component;
};

export const setupComponent = (instance) => {
  // initProps
  // initSlots
  // 初始化有状态的函数式组件
  setupStatefulComponent(instance);
};

const setupStatefulComponent = (instance: any) => {
  const Component = instance.type;
  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    handleSetupresult(instance, setupResult);
  }
};

const handleSetupresult = (instance, steupResult: any) => {
  // function Object
  // TODO function

  if (typeof steupResult === "object") {
    instance.setupState = steupResult;
  }

  finishComponentSetup(instance);
};

const finishComponentSetup = (instance) => {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
};
