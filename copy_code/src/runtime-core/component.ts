export const createComponentInstance = (vnode) => {
  const component = {
    vnode,
    type: vnode.type
  };

  return component;
};

export const setupComponent = (instance) => {
  // init props
  // init slots

  setupStatefulComponent(instance);
};

const setupStatefulComponent = (instance) => {
  const Component = instance.vnode.type;

  //ctx
  instacne.proxy = new Proxy(
    {},
    {
      get(target, key) {
        // 从setupState获取值
      }
    }
  );

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
};

const handleSetupResult = (instance, setupResult) => {
  // function object
  // TODO function
  // 这里目前只实现一个object

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  // 接下来需要保证组件的rander是有值的
  finishComponentSetup(instance);
};

const finishComponentSetup = (instance) => {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
};
