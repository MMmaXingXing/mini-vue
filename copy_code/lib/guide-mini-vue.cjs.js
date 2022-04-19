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
    //ctx
    instacne.proxy = new Proxy({}, {
        get: function (target, key) {
            // 从setupState获取值
        }
    });
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

const isObject = (val) => {
  return val !== undefined && typeof val === "object";
};

var render = function (vnode, container) {
    // render中来调用patch方法
    patch(vnode, container);
};
var patch = function (vnode, container) {
    // 尽行组件处理
    // 判断是component OR element
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
};
var processElement = function (vnode, container) {
    mountElement(vnode, container);
};
var mountElement = function (vnode, container) {
    var el = document.createElement(vnode.type);
    // 子元素处理
    var children = vnode.children;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // 参数处理
    var props = vnode.props;
    for (var key in props) {
        var val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
};
var mountChildren = function (vnode, container) {
    vnode.children.forEach(function (v) {
        patch(v, container);
    });
};
var processComponent = function (vnode, container) {
    mountComponent(vnode, container);
};
var mountComponent = function (vnode, container) {
    var instance = createComponentInstance(vnode);
    // 设置组件
    setupComponent(instance);
    // 掉用组件
    setupRenderEffect(instance, container);
};
var setupRenderEffect = function (instance, container) {
    // 虚拟节点树
    var subTree = instance.render();
    // vnode --> patch
    // vnode --> element --> mountElement(在patch中处理)
    patch(subTree, container);
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
            render(vnode, rootContainer);
        }
    };
};

var h = function (type, props, children) {
    return createVNode(type, props, children);
};

exports.createApp = createApp;
exports.h = h;
