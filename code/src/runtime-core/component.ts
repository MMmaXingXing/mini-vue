import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export const createComponentInstance = (vnode) => {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {}
  };

  component.emit = emit.bind(null, component) as any;
  return component;
};

export const setupComponent = (instance) => {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  // 初始化有状态的函数式组件
  setupStatefulComponent(instance);
};

const setupStatefulComponent = (instance: any) => {
  const Component = instance.type;

  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    });

    handleSetupResult(instance, setupResult);
  }
};

const handleSetupResult = (instance, steupResult: any) => {
  // function Object
  // TODO function

  if (typeof steupResult === "object") {
    instance.setupState = steupResult;
  }

  finishComponentSetup(instance);
};

const finishComponentSetup = (instance) => {
  const Component = instance.type;

  //   if (Component.render) {
  instance.render = Component.render;
  //   }
};
