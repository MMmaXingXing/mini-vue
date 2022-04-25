'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
const createVNode = (type, props, children) => {
    const vnode = {
        type,
        props,
        children,
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
const createTextVNode = (text) => {
    return createVNode(Text, {}, text);
};
const getShapeFlag = (type) => {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
};

const h = (type, props, children) => {
    return createVNode(type, props, children);
};

const renderSlots = (slots, name, props) => {
    // 具名插槽
    const slot = slots[name];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
};

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== undefined && typeof val === "object";
};
const hasChange = (value, newValue) => {
    return !Object.is(value, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    // add-foo --> addFoo
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    // add -> Add
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

let activeEffect = void 0;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        // 执行fn但是不搜集依赖
        if (!this.active) {
            return this._fn();
        }
        // 可以开始搜集依赖了
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 性能优化，增加一个active参数
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
const cleanupEffect = (effect) => {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
};
// 每一个对象里面的每一个key，都需要有一个依赖搜集的容器，即有一个容器将我们传进来的fn存进去
const targetMap = new Map();
const track = (target, key) => {
    if (!isTracking())
        return;
    console.log(key);
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
};
const trackEffects = (dep) => {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
};
const isTracking = () => {
    return shouldTrack && activeEffect !== undefined;
};
// 基于target，key去取depsMap中的值，最后遍历所有搜集到的fn，
const trigger = (target, key) => {
    let depsMap = targetMap === null || targetMap === void 0 ? void 0 : targetMap.get(target);
    let dep = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    triggerEffects(new Set(dep));
};
const triggerEffects = (dep) => {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
};
const effect = (fn, options = {}) => {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    // Object.assign(_effect, options);
    extend(_effect, options);
    _effect.run();
    // 用户可以自行选择事件调用effect
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
};

const createGetter = (isReadonly = false, shallow = false) => {
    return (target, key) => {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
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
const createSetter = () => {
    return (target, key, val) => {
        const res = Reflect.set(target, key, val);
        // 触发依赖
        trigger(target, key);
        return res;
    };
};
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key:${key}set失败，因为target是readonly， ${target}`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
const reactive = (raw) => {
    return createActiveObject(raw, mutableHandlers);
};
const readonly = (raw) => {
    return createActiveObject(raw, readonlyHandlers);
};
const shallowReadonly = (raw) => {
    return createActiveObject(raw, shallowReadonlyHandlers);
};
const createActiveObject = (target, baseHandler) => {
    if (!isObject(target)) {
        console.warn("target 必须是一个对象");
    }
    return new Proxy(target, baseHandler);
};

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 依赖搜集
        // if (isTracking()) {
        //   trackEffects(this.dep);
        // }
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // if (Object.is(this._value, newValue)) return;
        if (hasChange(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
const convert = (value) => {
    return isObject(value) ? reactive(value) : value;
};
const trackRefValue = (ref) => {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
};
const ref = (value) => {
    return new RefImpl(value);
};
const isRef = (ref) => {
    return !!ref.__v_isRef;
};
const unRef = (ref) => {
    return isRef(ref) ? ref.value : ref;
};
const proxyRefs = (objectWithRef) => {
    return new Proxy(objectWithRef, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
};

const emit = (instance, event, ...args) => {
    console.log("emit", event);
    // instance.props --> event
    const { props } = instance;
    // TPP
    // 先写成一个特定的行为 --> 重构成通用的行文
    // add
    // const handler = props["onAdd"];
    // handler && handler();
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler & handler(...args);
};

const initProps = (instance, rawProps) => {
    instance.props = rawProps || {};
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // setup --> options data
        // $data
    }
};

const initSlots = (instance, children) => {
    // 数组类型结构渲染
    // instance.slots = Array.isArray(children) ? children : [children];
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
};
const normalizeObjectSlots = (children, slots) => {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
    slots = slots;
};
const normalizeSlotValue = (value) => {
    return Array.isArray(value) ? value : [value];
};

const createComponentInstance = (vnode, parent) => {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        proxy: null,
        isMounted: false,
        subtree: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
};
const setupComponent = (instance) => {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 初始化有状态的函数式组件
    setupStatefulComponent(instance);
};
const setupStatefulComponent = (instance) => {
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
const handleSetupResult = (instance, steupResult) => {
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
const getCurrentInstance = () => {
    return currentInstance;
};
const setCurrentInstance = (instance) => {
    currentInstance = instance;
};

const provide = (key, value) => {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 使用原型链改写
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            // 初始化操作只在init做
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
};
const inject = (key, defaultValue) => {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvide = currentInstance.parent;
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

const createAppAPI = (render) => {
    const createApp = (rootComponent) => {
        return {
            mount(rootContainer) {
                // 先转换为 vnode
                // component --> vnode
                // 所有逻辑操作都会基于虚拟节点来做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
    return createApp;
};

const createRenderer = (options) => {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    const render = (vnode, container) => {
        // patch 调用patch方法
        patch(null, vnode, container, null);
    };
    // n1 --> 老
    // n2 --> 新
    const patch = (n1, n2, container, parentComponent = null) => {
        // 如何判断是不是element，
        // processElement()
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    };
    const processText = (n1, n2, container) => {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    };
    const processFragment = (n1, n2, container, parentComponent) => {
        // Implemment
        // 将虚拟节点
        mountChildren(n2, container, parentComponent);
    };
    const processElement = (n1, n2, container, parentComponent) => {
        // init --> update
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    };
    const patchElement = (n1, n2, container) => {
        console.log("patchElement");
        console.log(n1);
        console.log(n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        //
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        // props
        // children 更新对比
    };
    const patchProps = (el, oldProps, newProps) => {
        // 新老节点对比，来查看值是否一样，如果不一样则触发修改
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in oldProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    };
    const mountElement = (vnode, container, parentComponent) => {
        // 这里的vnode --> element --> div
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 子元素节点处理
        // string array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // vnode
            mountChildren(vnode, el, parentComponent);
        }
        // props参数处理
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // el.setAttribute("id", "root");
        // document.body.append(el);
        hostInsert(el, container);
    };
    // 进行深层vnode节点处理
    const mountChildren = (vnode, container, parentComponent) => {
        vnode.children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    };
    const processComponent = (n1, n2, container, parentComponent) => {
        mountComponent(n2, container, parentComponent);
    };
    const mountComponent = (initnalVNode, container, parentComponent) => {
        const instance = createComponentInstance(initnalVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initnalVNode, container);
    };
    const setupRenderEffect = (instance, initnalVNode, container) => {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode --> patch
                // vnode --> element --> mountElement
                patch(null, subTree, container, instance);
                // element --> mount
                initnalVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    };
    return {
        createApp: createAppAPI(render)
    };
};

const createElement = (type) => {
    console.log("createElement-----------------------");
    return document.createElement(type);
};
function patchProp(el, key, prevProp, nextVal) {
    console.log("patchProp-----------------------");
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === null || nextVal == undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
const insert = (el, container) => {
    console.log("insert-----------------------");
    container.append(el);
};
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
const createApp = (...args) => {
    return renderer.createApp(...args);
};

exports.createApp = createApp;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.patchProp = patchProp;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
