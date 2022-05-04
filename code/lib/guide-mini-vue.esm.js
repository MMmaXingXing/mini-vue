const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
const createVNode = (type, props, children) => {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
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
const isString = (value) => {
    return typeof value === "string";
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
    $slots: (i) => i.slots,
    $props: (i) => i.props
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
        next: null,
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    // template
    instance.render = Component.render;
};
let currentInstance = null;
const getCurrentInstance = () => {
    return currentInstance;
};
const setCurrentInstance = (instance) => {
    currentInstance = instance;
};
let compiler;
const registerRuntimeCompiler = (_compiler) => {
    compiler = _compiler;
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

const shouldUpdateComponent = (prevVNode, nextVNode) => {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key])
            return true;
    }
    return false;
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

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
const nextTick = (fn) => {
    return fn ? p.then(fn) : p;
};
const queueJobs = (job) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};
const queueFlush = () => {
    if (isFlushPending)
        return;
    isFlushPending = true;
    //   Promise.resolve().then(() => {});
    nextTick(flushJobs);
};
const flushJobs = () => {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
};

const createRenderer = (options) => {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementChildren: hostSetElementText } = options;
    const render = (vnode, container) => {
        // patch 调用patch方法
        patch(null, vnode, container, null, null);
    };
    // n1 --> 老
    // n2 --> 新
    const patch = (n1, n2, container, parentComponent = null, anchor) => {
        // 如何判断是不是element，
        // processElement()
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    };
    const processText = (n1, n2, container) => {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    };
    const processFragment = (n1, n2, container, parentComponent, anchor) => {
        // Implemment
        // 将虚拟节点
        mountChildren(n2.children, container, parentComponent, anchor);
    };
    const processElement = (n1, n2, container, parentComponent, anchor) => {
        // init --> update
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    };
    const patchElement = (n1, n2, container, parentComponent, anchor) => {
        console.log("patchElement");
        console.log(n1);
        console.log(n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        //
        const el = (n2.el = n1.el);
        patchChildern(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
        // props
        // children 更新对比
    };
    const patchChildern = (n1, n2, container, parentComponent, anchor) => {
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        // 新的是text
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 1. 老children清空
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                // 2. 设置text
                hostSetElementText(container, c2);
            }
        }
        else {
            // 新的是Array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 之前的清空掉
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // Array -> Array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    };
    const patchKeyedChildren = (c1, c2, container, parentComponent, parentAnchor) => {
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        const isSomeVNdoeType = (n1, n2) => {
            // 根据type 和 key来判断两个节点是否一样
            return n1.type === n2.type && n1.key === n2.key;
        };
        // 从左往右找到不同节点的i的位置
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 判断两个节点是否一样，一样的话再次调用patch去递归来处理
            if (isSomeVNdoeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右边的处理
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNdoeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3. 新的比老的多，创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                // 可能是多个节点
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 4. 新的比老的少
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            // 先遍历老的节点
            let s1 = i;
            let s2 = i;
            // 记录新的节点的总数量,索引+1
            const toBePatched = e2 - s2 + 1;
            //记录当前处理的总数量
            let patched = 0;
            const keyToNewIndexMap = new Map();
            // 新元素对于老元素的映射顺序
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 通过新组件创建映射表
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 通过老组件进行查找
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                }
                let newIndex;
                // 有key取key
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNdoeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex == undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 老组件部分为 newIndexToOldIndexMap 来创建下标值, 从0，1，2开始，且值避开0
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    // 处理完新节点自增
                    patched++;
                }
            }
            // 获取最长递增子序列来处理对应d对比逻辑
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 最长递增子序列指针
            let j = increasingNewIndexSequence.length - 1;
            // 倒叙使节点稳定从而进入插入
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 获取即将插入的节点
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j] - 1) {
                        console.log("移动位置");
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
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
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props参数处理
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // el.setAttribute("id", "root");
        // document.body.append(el);
        hostInsert(el, container, anchor);
    }
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            // insert
            hostRemove(el);
        }
    };
    // 进行深层vnode节点处理
    const mountChildren = (children, container, parentComponent, anchor) => {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    };
    const processComponent = (n1, n2, container, parentComponent, anchor) => {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    };
    const updateComponent = (n1, n2) => {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            // 使用next来存储更新过后的节点
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            n2.vnode = n2;
        }
    };
    const mountComponent = (initnalVNode, container, parentComponent, anchor) => {
        const instance = (initnalVNode.component = createComponentInstance(initnalVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initnalVNode, container, anchor);
    };
    const setupRenderEffect = (instance, initnalVNode, container, anchor) => {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode --> patch
                // vnode --> element --> mountElement
                patch(null, subTree, container, instance, anchor);
                // element --> mount
                initnalVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                // 需要一个更新完成后的虚拟节点,之前的节点为vnode
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log("update - schedular");
                queueJobs(instance.update);
            }
        });
    };
    const updateComponentPreRender = (instance, nextVNode) => {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    };
    return {
        createApp: createAppAPI(render)
    };
};
const getSequence = (arr) => {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
const insert = (child, parent, anchor) => {
    console.log("insert-----------------------");
    parent.insertBefore(child, anchor || null);
};
const remove = (child) => {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
};
const setElementChildren = (el, text) => {
    el.textContent = text;
};
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementChildren
});
const createApp = (...args) => {
    return renderer.createApp(...args);
};

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement,
    patchProp: patchProp,
    insert: insert,
    remove: remove,
    setElementChildren: setElementChildren,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

const generate = (ast) => {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(context, ast);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}){`);
    push(`return `);
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code
    };
};
const genFunctionPreamble = (context, ast) => {
    const { push } = context;
    const vueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`import { ${ast.helpers.map(aliasHelper)} } from ${vueBinging}`);
    }
    push("\n");
    push("return ");
};
const createCodegenContext = () => {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
};
const genNode = (node, context) => {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(context, node);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
};
const genCompoundExpression = (node, context) => {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
};
const genElement = (node, context) => {
    const { push, helper } = context;
    const { tag, children, props } = node;
    // const child = children[0];
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // genNode(child, context);
    // 元素节点最顶层只会有一层，因此
    // for (let i = 0; i < children.length; i++) {
    //   // 新增复合节点类型 compound
    //   const child = children[i];
    //   genNode(child, context);
    // }
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context);
    push(")");
};
const genNodeList = (nodes, context) => {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
};
const genNullable = (args) => {
    return args.map((arg) => arg || "null");
};
const genExpression = (node, context) => {
    const { push } = context;
    push(`${node.content}`);
};
const genInterpolation = (node, context) => {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
};
const genText = (context, node) => {
    const { push } = context;
    push(`'${node.content}'`);
};

const baseParse = (content) => {
    // 创建一个全局的上下文对象
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
};
const parseChildren = (context, ancestors) => {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                console.log("parse elemet");
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
};
const isEnd = (context, ancestors) => {
    // 2. 结束标签
    const s = context.source;
    // 根据压栈来命中结束标签
    if (s.startsWith(`</`)) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 1. 内容为空
    return !s;
};
const parseText = (context) => {
    let endIndex = context.source.length;
    let endToken = ["<", "{{"];
    for (let i = 0; i < endToken.length; i++) {
        const index = context.source.indexOf(endToken[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    // 1. 取值，获取content
    const content = parseTextData(context, endIndex);
    console.log("content--------", content);
    return {
        type: 3 /* TEXT */,
        content: content
    };
};
const parseTextData = (context, length) => {
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, length);
    return content;
};
const parseElement = (context, ancestors) => {
    // Implement
    // 1. 解析tag
    const element = parseTag(context, 0 /* START */);
    ancestors.push(element);
    // 如果有子节点则内部递归处理
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    // if (context.source) {
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* END */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    // }
    return element;
};
const startsWithEndTagOpen = (source, tag) => {
    return (source.startsWith("</") &&
        source.slice(2, tag.length + 2).toLowerCase() === tag.toLowerCase());
};
const parseTag = (context, type) => {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2. 删除处理完的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* END */)
        return;
    return {
        type: 2 /* ELEMENT */,
        tag
    };
};
const parseInterpolation = (context) => {
    // {{message}}
    // 关键字变化点，抽取出来使程序解耦
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, closeDelimiter.length);
    // 前两个数据可以将前两个字符串干掉来进行一字符的推进
    advanceBy(context, openDelimiter.length);
    const rowContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rowContentLength);
    const content = rawContent.trim();
    // 获取之后删除
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content: content
        }
    };
};
const advanceBy = (context, length) => {
    context.source = context.source.slice(length);
};
const createRoot = (children) => {
    return {
        type: 4 /* ROOT */,
        children,
        helpers: []
    };
};
const createParseContext = (content) => {
    return {
        source: content
    };
};

const transform = (root, options = {}) => {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    traverseNode(root, context);
    // 2. 修改 text content
    // root.codegenNode
    createRootCodgen(root);
    root.helpers = [...context.helpers.keys()];
};
const createRootCodgen = (root) => {
    const child = root.children[0];
    if (child.type === 2 /* ELEMENT */ && child.codegenNode) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
};
const createTransformContext = (root, options) => {
    // 创建全局上下文对象来存储我们传入的数据
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
};
const traverseNode = (node, context) => {
    // 实现深度优先搜索
    // 1. element
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    // 判断类型
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            // 判断是不是插值 balabala
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
};
const traverseChildren = (node, context) => {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
};

const createVNodeCall = (context, tag, props, children) => {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag: tag,
        props: props,
        children: children
    };
};

const transformElement = (node, context) => {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `"${node.tag}"`;
            // props
            let vnodeProps;
            //children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
};

// 触发时包含在插值类型中
const transformExpression = (node) => {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
};
function processExpression(node) {
    node.content = "_ctx." + node.content;
    return node;
}

const isText = (node) => {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
};

const transformText = (node) => {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            let currentContainer;
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const nextChild = children[j];
                        if (isText(nextChild)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(nextChild);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
};

const baseCompile = (template) => {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
};

// mini-vue 出口
// render
const compileToFunction = (template) => {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
};
registerRuntimeCompiler(compileToFunction);

export { createApp, createElement, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, nextTick, patchProp, provide, proxyRefs, ref, registerRuntimeCompiler, remove, renderSlots, setElementChildren };
