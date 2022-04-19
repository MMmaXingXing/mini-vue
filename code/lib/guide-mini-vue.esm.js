var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; }
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        var setupState = instance.setupState;
        if (key in setupState) {
            return setupState[key];
        }
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // setup --> options data
        // $data
    }
};

var createComponentInstance = function (vnode) {
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {}
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
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    var setup = Component.setup;
    if (setup) {
        var setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
};
var handleSetupResult = function (instance, steupResult) {
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
    patch(vnode, container);
};
var patch = function (vnode, container) {
    // 如何判断是不是element，
    // processElement()
    var shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 1 /* ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
};
var processElement = function (vnode, container) {
    // init --> update
    mountElement(vnode, container);
};
var mountElement = function (vnode, container) {
    // 这里的vnode --> element --> div
    var el = (vnode.el = document.createElement(vnode.type));
    // 子元素节点处理
    // string array
    var children = vnode.children, shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        // vnode
        mountChildren(vnode, el);
    }
    // props参数处理
    var props = vnode.props;
    for (var key in props) {
        var val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
    // el.setAttribute("id", "root");
    // document.body.append(el);
};
// 进行深层vnode节点处理
var mountChildren = function (vnode, container) {
    vnode.children.forEach(function (v) {
        patch(v, container);
    });
};
var processComponent = function (vnode, container) {
    mountComponent(vnode, container);
};
var mountComponent = function (initnalVNode, container) {
    var instance = createComponentInstance(initnalVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initnalVNode, container);
};
var setupRenderEffect = function (instance, initnalVNode, container) {
    var proxy = instance.proxy;
    var subTree = instance.render.call(proxy);
    // vnode --> patch
    // vnode --> element --> mountElement
    patch(subTree, container);
    // element --> mount
    initnalVNode.el = subTree.el;
};

var createVNode = function (type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    return vnode;
};
var getShapeFlag = function (type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
};

var createApp = function (rootComponent) {
    return {
        mount: function (rootContainer) {
            // 先转换为 vnode
            // component --> vnode
            // 所有逻辑操作都会基于虚拟节点来做处理
            var vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
};

var h = function (type, props, children) {
    return createVNode(type, props, children);
};

export { createApp, h };
