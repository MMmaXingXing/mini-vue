'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var createComponentInstance = function (vnode) {
    var component = {
        vnode: vnode,
        type: vnode.type
    };
    return component;
};
var setupComponent = function (instance) {
    // initProps
    // initSlots
    // 初始化有状态的函数式组件
    setupStatefulComponent(instance);
};
var setupStatefulComponent = function (instance) {
    var Component = instance.type;
    var setup = Component.setup;
    if (setup) {
        var setupResult = setup();
        handleSetupresult(instance, setupResult);
    }
};
var handleSetupresult = function (instance, steupResult) {
    // function Object
    // TODO function
    if (typeof steupResult === "object") {
        instance.setupState = steupResult;
    }
    finishComponentSetup(instance);
};
var finishComponentSetup = function (instance) {
    var Component = instance.type;
    //   if (Component.render) {
    instance.render = Component.render;
    //   }
};

var render = function (vnode, container) {
    // patch 调用patch方法
    patch(vnode);
};
var patch = function (vnode, container) {
    // 判断是不是element，
    processComponent(vnode);
};
var processComponent = function (vnode, container) {
    mountComponent(vnode);
};
var mountComponent = function (vnode, container) {
    var instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
};
var setupRenderEffect = function (instance, container) {
    var subTree = instance.render();
    // vnode --> patch
    // vnode --> element --> mountElement
    patch(subTree);
};

var createVNode = function (type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children
    };
    return vnode;
};

var createApp = function (rootComponent) {
    return {
        mount: function (rootContainer) {
            // 先转换为 vnode
            // component --> vnode
            // 所有逻辑操作都会基于虚拟节点来做处理
            var vnode = createVNode(rootComponent);
            render(vnode);
        }
    };
};

var h = function (type, props, children) {
    return createVNode(type, props, children);
};

exports.createApp = createApp;
exports.h = h;
