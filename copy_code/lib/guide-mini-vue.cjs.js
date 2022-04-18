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
    // init props
    // init slots
    setupStatefulComponent(instance);
};
var setupStatefulComponent = function (instance) {
    var Component = instance.vnode.type;
    var setup = Component.setup;
    if (setup) {
        var setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
};
var handleSetupResult = function (instance, setupResult) {
    // function object
    // TODO function
    // 这里目前只实现一个object
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    // 接下来需要保证组件的rander是有值的
    finishComponentSetup(instance);
};
var finishComponentSetup = function (instance) {
    var Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
};

var render = function (vnode, container) {
    // render中来调用patch方法
    patch(vnode);
};
var patch = function (vnode, container) {
    // 尽行组件处理
    // 判断是component OR element
    processComponent(vnode);
};
var processComponent = function (vnode, container) {
    mountComponent(vnode);
};
var mountComponent = function (vnode, container) {
    var instance = createComponentInstance(vnode);
    // 设置组件
    setupComponent(instance);
    // 掉用组件
    setupRenderEffect(instance);
};
var setupRenderEffect = function (instance, container) {
    // 虚拟节点树
    var subTree = instance.render();
    // vnode --> patch
    // vnode --> element --> mountElement(在patch中处理)
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
            // component --> vnode
            // 所有处理基于虚拟节点来处理
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
