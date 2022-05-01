import { shallowReadonly } from "../reactivity/reactive";
import { proxyRefs } from "../reactivity/ref";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export const createComponentInstance = (vnode, parent) => {
  const component = {
    vnode,
    type: vnode.type,
    next: null, // 存储下次要更新的虚拟几诶单值
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    proxy: null,
    isMounted: false,
    subtree: {},
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
    setCurrentInstance(instance);
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
    instance.setupState = proxyRefs(steupResult);
  }

  finishComponentSetup(instance);
};

const finishComponentSetup = (instance) => {
  const Component = instance.type;

  //   if (Component.render) {
  instance.render = Component.render;
  //   }
};

let currentInstance = null;
export const getCurrentInstance = () => {
  return currentInstance;
};

export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
