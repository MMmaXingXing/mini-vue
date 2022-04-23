'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Fragment = Symbol("Fragment");
var Text = Symbol("Text");
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
    // 组件 + children 为 object 则满足 slots 需求
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
};
var createTextVNode = function (text) {
    return createVNode(Text, {}, text);
};
var getShapeFlag = function (type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
};

var h = function (type, props, children) {
    return createVNode(type, props, children);
};

var renderSlots = function (slots, name, props) {
    // 具名插槽
    var slot = slots[name];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
};

var extend = Object.assign;
var isObject = function (val) {
    return val !== undefined && typeof val === "object";
};
var hasChange = function (value, newValue) {
    return !Object.is(value, newValue);
};
var hasOwn = function (val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
};
var camelize = function (str) {
    // add-foo --> addFoo
    return str.replace(/-(\w)/g, function (_, c) {
        return c ? c.toUpperCase() : "";
    });
};
var capitalize = function (str) {
    // add -> Add
    return str.charAt(0).toUpperCase() + str.slice(1);
};
var toHandlerKey = function (str) {
    return str ? "on" + capitalize(str) : "";
};

var activeEffect;
var shouldTrack;
var ReactiveEffect = /** @class */ (function () {
    function ReactiveEffect(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    ReactiveEffect.prototype.run = function () {
        // 执行fn但是不搜集依赖
        if (!this.active) {
            return this._fn();
        }
        // 可以开始搜集依赖了
        shouldTrack = true;
        activeEffect = this;
        var result = this._fn();
        shouldTrack = false;
        return result;
    };
    ReactiveEffect.prototype.stop = function () {
        // 性能优化，增加一个active参数
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    };
    return ReactiveEffect;
}());
var cleanupEffect = function (effect) {
    effect.deps.forEach(function (dep) {
        dep.delete(effect);
    });
    effect.deps.length = 0;
};
// 每一个对象里面的每一个key，都需要有一个依赖搜集的容器，即有一个容器将我们传进来的fn存进去
var targetMap = new Map();
var track = function (target, key) {
    if (!isTracking())
        return;
    console.log(key);
    // target -> key -> dep
    var depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    var dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
};
var trackEffects = function (dep) {
    //  搜集依赖处理拆分为公共方法
    debugger;
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
};
var isTracking = function () {
    return shouldTrack && activeEffect !== undefined;
};
// 基于target，key去取depsMap中的值，最后遍历所有搜集到的fn，
var trigger = function (target, key) {
    var depsMap = targetMap.get(target);
    var dep = depsMap.get(key);
    triggerEffects(dep);
};
var triggerEffects = function (dep) {
    for (var _i = 0, dep_1 = dep; _i < dep_1.length; _i++) {
        var effect_1 = dep_1[_i];
        console.log(effect_1._fn);
        debugger;
        if (effect_1.scheduler) {
            effect_1.scheduler();
        }
        else {
            effect_1.run();
        }
    }
};
var effect = function (fn, options) {
    if (options === void 0) { options = {}; }
    debugger;
    var _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    // Object.assign(_effect, options);
    extend(_effect, options);
    _effect.run();
    // 用户可以自行选择事件调用effect
    var runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
};

var createGetter = function (isReadonly, shallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (shallow === void 0) { shallow = false; }
    return function (target, key) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        var res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 依赖搜集
        if (!isReadonly)
            track(target, key);
        return res;
    };
};
var createSetter = function () {
    return function (target, key, val) {
        var res = Reflect.set(target, key, val);
        // 触发依赖
        trigger(target, key);
        return res;
    };
};
var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var shallowReadonlyGet = createGetter(true, true);
var mutableHandlers = {
    get: get,
    set: set
};
var readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key) {
        console.warn("key:".concat(key, "set\u5931\u8D25\uFF0C\u56E0\u4E3Atarget\u662Freadonly\uFF0C ").concat(target));
        return true;
    }
};
var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
var reactive = function (raw) {
    return createActiveObject(raw, mutableHandlers);
};
var readonly = function (raw) {
    return createActiveObject(raw, readonlyHandlers);
};
var shallowReadonly = function (raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
};
var createActiveObject = function (target, baseHandler) {
    if (!isObject(target)) {
        console.warn("target 必须是一个对象");
    }
    return new Proxy(target, baseHandler);
};

var RefImpl = /** @class */ (function () {
    function RefImpl(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    Object.defineProperty(RefImpl.prototype, "value", {
        get: function () {
            // 依赖搜集
            // if (isTracking()) {
            //   trackEffects(this.dep);
            // }
            trackRefValue(this);
            return this._value;
        },
        set: function (newValue) {
            // if (Object.is(this._value, newValue)) return;
            if (hasChange(this._rawValue, newValue)) {
                this._rawValue = newValue;
                this._value = convert(newValue);
                triggerEffects(this.dep);
            }
        },
        enumerable: false,
        configurable: true
    });
    return RefImpl;
}());
var convert = function (value) {
    return isObject(value) ? reactive(value) : value;
};
var trackRefValue = function (ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
};
var ref = function (value) {
    return new RefImpl(value);
};
var isRef = function (ref) {
    return !!ref.__v_isRef;
};
var unRef = function (ref) {
    return isRef(ref) ? ref.value : ref;
};
var proxyRefs = function (objectWithRef) {
    return new Proxy(objectWithRef, {
        get: function (target, key) {
            return unRef(Reflect.get(target, key));
        },
        set: function (target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
};

var emit = function (instance, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    console.log("emit", event);
    // instance.props --> event
    var props = instance.props;
    // TPP
    // 先写成一个特定的行为 --> 重构成通用的行文
    // add
    // const handler = props["onAdd"];
    // handler && handler();
    var handlerName = toHandlerKey(camelize(event));
    var handler = props[handlerName];
    handler & handler.apply(void 0, args);
};

var initProps = function (instance, rawProps) {
    instance.props = rawProps || {};
};

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return i.slots; }
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        var setupState = instance.setupState, props = instance.props;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // setup --> options data
        // $data
    }
};

var initSlots = function (instance, children) {
    // 数组类型结构渲染
    // instance.slots = Array.isArray(children) ? children : [children];
    var vnode = instance.vnode;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
};
var normalizeObjectSlots = function (children, slots) {
    var _loop_1 = function (key) {
        var value = children[key];
        slots[key] = function (props) { return normalizeSlotValue(value(props)); };
    };
    for (var key in children) {
        _loop_1(key);
    }
    slots = slots;
};
var normalizeSlotValue = function (value) {
    return Array.isArray(value) ? value : [value];
};

var createComponentInstance = function (vnode, parent) {
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent: parent,
        proxy: null,
        emit: function () { }
    };
    component.emit = emit.bind(null, component);
    return component;
};
var setupComponent = function (instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 初始化有状态的函数式组件
    setupStatefulComponent(instance);
};
var setupStatefulComponent = function (instance) {
    var Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    var setup = Component.setup;
    if (setup) {
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        handleSetupResult(instance, setupResult);
    }
};
var handleSetupResult = function (instance, steupResult) {
    // function Object
    // TODO function
    if (typeof steupResult === "object") {
        instance.setupState = proxyRefs(steupResult);
    }
    finishComponentSetup(instance);
};
var finishComponentSetup = function (instance) {
    var Component = instance.type;
    //   if (Component.render) {
    instance.render = Component.render;
    //   }
};
var currentInstance = null;
var getCurrentInstance = function () {
    return currentInstance;
};
var setCurrentInstance = function (instance) {
    currentInstance = instance;
};

var provide = function (key, value) {
    var _a;
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var provides = currentInstance.provides;
        // 使用原型链改写
        var parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            // 初始化操作只在init做
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
};
var inject = function (key, defaultValue) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var parentProvide = currentInstance.parent;
        if (key in parentProvide) {
            return parentProvide[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
};

var createAppAPI = function (render) {
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
    return createApp;
};

var createRenderer = function (options) {
    var hostCreateElement = options.createElement, hostPatchProp = options.patchProp, hostInsert = options.insert;
    var render = function (vnode, container) {
        // patch 调用patch方法
        patch(vnode, container);
    };
    var patch = function (vnode, container, parentComponent) {
        if (parentComponent === void 0) { parentComponent = null; }
        // 如何判断是不是element，
        // processElement()
        var type = vnode.type, shapeFlag = vnode.shapeFlag;
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    };
    var processText = function (vnode, container) {
        var children = vnode.children;
        var textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    };
    var processFragment = function (vnode, container, parentComponent) {
        // Implemment
        // 将虚拟节点
        mountChildren(vnode, container, parentComponent);
    };
    var processElement = function (vnode, container, parentComponent) {
        // init --> update
        mountElement(vnode, container, parentComponent);
    };
    var mountElement = function (vnode, container, parentComponent) {
        // 这里的vnode --> element --> div
        var el = (vnode.el = hostCreateElement(vnode.type));
        // 子元素节点处理
        // string array
        var children = vnode.children, shapeFlag = vnode.shapeFlag;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // vnode
            mountChildren(vnode, el, parentComponent);
        }
        // props参数处理
        var props = vnode.props;
        for (var key in props) {
            var val = props[key];
            hostPatchProp(el, key, val);
        }
        // el.setAttribute("id", "root");
        // document.body.append(el);
        hostInsert(el, container);
    };
    // 进行深层vnode节点处理
    var mountChildren = function (vnode, container, parentComponent) {
        vnode.children.forEach(function (v) {
            patch(v, container, parentComponent);
        });
    };
    var processComponent = function (vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    };
    var mountComponent = function (initnalVNode, container, parentComponent) {
        var instance = createComponentInstance(initnalVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initnalVNode, container);
    };
    var setupRenderEffect = function (instance, initnalVNode, container) {
        effect(function () {
            var proxy = instance.proxy;
            var subTree = instance.render.call(proxy);
            console.log(subTree);
            // vnode --> patch
            // vnode --> element --> mountElement
            patch(subTree, container, instance);
            // element --> mount
            initnalVNode.el = subTree.el;
        });
    };
    return {
        createApp: createAppAPI(render)
    };
};

var createElement = function (type) {
    console.log("createElement-----------------------");
    return document.createElement(type);
};
var patchProp = function (el, key, val) {
    console.log("patchProp-----------------------");
    var isOn = function (key) { return /^on[A-Z]/.test(key); };
    if (isOn(key)) {
        var event_1 = key.slice(2).toLowerCase();
        el.addEventListener(event_1, val);
    }
    else {
        el.setAttribute(key, val);
    }
};
var insert = function (el, container) {
    console.log("insert-----------------------");
    container.append(el);
};
var renderer = createRenderer({
    createElement: createElement,
    patchProp: patchProp,
    insert: insert
});
var createApp = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return renderer.createApp.apply(renderer, args);
};

exports.createApp = createApp;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.patchProp = patchProp;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
