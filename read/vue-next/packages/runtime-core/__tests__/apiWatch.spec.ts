import {
  watch,
  watchEffect,
  reactive,
  computed,
  nextTick,
  ref,
  defineComponent,
  getCurrentInstance,
  ComponentInternalInstance,
  ComponentPublicInstance
} from '../src/index'
import {
  render,
  nodeOps,
  serializeInner,
  TestElement,
  h,
  createApp,
  watchPostEffect,
  watchSyncEffect
} from '@vue/runtime-test'
import {
  ITERATE_KEY,
  DebuggerEvent,
  TrackOpTypes,
  TriggerOpTypes,
  triggerRef,
  shallowRef,
  Ref,
  effectScope
} from '@vue/reactivity'

// reference: https://vue-composition-api-rfc.netlify.com/api.html#watch

describe('api: watch', () => {
  it('effect', async () => {
    const state = reactive({ count: 0 })
    let dummy
    watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)

    state.count++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('watching single source: getter', async () => {
    const state = reactive({ count: 0 })
    let dummy
    watch(
      () => state.count,
      (count, prevCount) => {
        dummy = [count, prevCount]
        // assert types
        count + 1
        if (prevCount) {
          prevCount + 1
        }
      }
    )
    state.count++
    await nextTick()
    expect(dummy).toMatchObject([1, 0])
  })

  it('watching single source: ref', async () => {
    const count = ref(0)
    let dummy
    watch(count, (count, prevCount) => {
      dummy = [count, prevCount]
      // assert types
      count + 1
      if (prevCount) {
        prevCount + 1
      }
    })
    count.value++
    await nextTick()
    expect(dummy).toMatchObject([1, 0])
  })

  it('watching single source: array', async () => {
    const array = reactive([] as number[])
    const spy = jest.fn()
    watch(array, spy)
    array.push(1)
    await nextTick()
    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith([1], expect.anything(), expect.anything())
  })

  it('should not fire if watched getter result did not change', async () => {
    const spy = jest.fn()
    const n = ref(0)
    watch(() => n.value % 2, spy)

    n.value++
    await nextTick()
    expect(spy).toBeCalledTimes(1)

    n.value += 2
    await nextTick()
    // should not be called again because getter result did not change
    expect(spy).toBeCalledTimes(1)
  })

  it('watching single source: computed ref', async () => {
    const count = ref(0)
    const plus = computed(() => count.value + 1)
    let dummy
    watch(plus, (count, prevCount) => {
      dummy = [count, prevCount]
      // assert types
      count + 1
      if (prevCount) {
        prevCount + 1
      }
    })
    count.value++
    await nextTick()
    expect(dummy).toMatchObject([2, 1])
  })

  it('watching primitive with deep: true', async () => {
    const count = ref(0)
    let dummy
    watch(
      count,
      (c, prevCount) => {
        dummy = [c, prevCount]
      },
      {
        deep: true
      }
    )
    count.value++
    await nextTick()
    expect(dummy).toMatchObject([1, 0])
  })

  it('directly watching reactive object (with automatic deep: true)', async () => {
    const src = reactive({
      count: 0
    })
    let dummy
    watch(src, ({ count }) => {
      dummy = count
    })
    src.count++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('watching multiple sources', async () => {
    const state = reactive({ count: 1 })
    const count = ref(1)
    const plus = computed(() => count.value + 1)

    let dummy
    watch([() => state.count, count, plus], (vals, oldVals) => {
      dummy = [vals, oldVals]
      // assert types
      vals.concat(1)
      oldVals.concat(1)
    })

    state.count++
    count.value++
    await nextTick()
    expect(dummy).toMatchObject([
      [2, 2, 3],
      [1, 1, 2]
    ])
  })

  it('watching multiple sources: readonly array', async () => {
    const state = reactive({ count: 1 })
    const status = ref(false)

    let dummy
    watch([() => state.count, status] as const, (vals, oldVals) => {
      dummy = [vals, oldVals]
      const [count] = vals
      const [, oldStatus] = oldVals
      // assert types
      count + 1
      oldStatus === true
    })

    state.count++
    status.value = true
    await nextTick()
    expect(dummy).toMatchObject([
      [2, true],
      [1, false]
    ])
  })

  it('watching multiple sources: reactive object (with automatic deep: true)', async () => {
    const src = reactive({ count: 0 })
    let dummy
    watch([src], ([state]) => {
      dummy = state
      // assert types
      state.count === 1
    })
    src.count++
    await nextTick()
    expect(dummy).toMatchObject({ count: 1 })
  })

  it('warn invalid watch source', () => {
    // @ts-ignore
    watch(1, () => {})
    expect(`Invalid watch source`).toHaveBeenWarned()
  })

  it('warn invalid watch source: multiple sources', () => {
    watch([1], () => {})
    expect(`Invalid watch source`).toHaveBeenWarned()
  })

  it('stopping the watcher (effect)', async () => {
    const state = reactive({ count: 0 })
    let dummy
    const stop = watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)

    stop()
    state.count++
    await nextTick()
    // should not update
    expect(dummy).toBe(0)
  })

  it('stopping the watcher (with source)', async () => {
    const state = reactive({ count: 0 })
    let dummy
    const stop = watch(
      () => state.count,
      count => {
        dummy = count
      }
    )

    state.count++
    await nextTick()
    expect(dummy).toBe(1)

    stop()
    state.count++
    await nextTick()
    // should not update
    expect(dummy).toBe(1)
  })

  it('cleanup registration (effect)', async () => {
    const state = reactive({ count: 0 })
    const cleanup = jest.fn()
    let dummy
    const stop = watchEffect(onCleanup => {
      onCleanup(cleanup)
      dummy = state.count
    })
    expect(dummy).toBe(0)

    state.count++
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    stop()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  it('cleanup registration (with source)', async () => {
    const count = ref(0)
    const cleanup = jest.fn()
    let dummy
    const stop = watch(count, (count, prevCount, onCleanup) => {
      onCleanup(cleanup)
      dummy = count
    })

    count.value++
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(0)
    expect(dummy).toBe(1)

    count.value++
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(2)

    stop()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  it('flush timing: pre (default)', async () => {
    const count = ref(0)
    const count2 = ref(0)

    let callCount = 0
    let result1
    let result2
    const assertion = jest.fn((count, count2Value) => {
      callCount++
      // on mount, the watcher callback should be called before DOM render
      // on update, should be called before the count is updated
      const expectedDOM = callCount === 1 ? `` : `${count - 1}`
      result1 = serializeInner(root) === expectedDOM

      // in a pre-flush callback, all state should have been updated
      const expectedState = callCount - 1
      result2 = count === expectedState && count2Value === expectedState
    })

    const Comp = {
      setup() {
        watchEffect(() => {
          assertion(count.value, count2.value)
        })
        return () => count.value
      }
    }
    const root = nodeOps.createElement('div')
    render(h(Comp), root)
    expect(assertion).toHaveBeenCalledTimes(1)
    expect(result1).toBe(true)
    expect(result2).toBe(true)

    count.value++
    count2.value++
    await nextTick()
    // two mutations should result in 1 callback execution
    expect(assertion).toHaveBeenCalledTimes(2)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('flush timing: post', async () => {
    const count = ref(0)
    let result
    const assertion = jest.fn(count => {
      result = serializeInner(root) === `${count}`
    })

    const Comp = {
      setup() {
        watchEffect(
          () => {
            assertion(count.value)
          },
          { flush: 'post' }
        )
        return () => count.value
      }
    }
    const root = nodeOps.createElement('div')
    render(h(Comp), root)
    expect(assertion).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)

    count.value++
    await nextTick()
    expect(assertion).toHaveBeenCalledTimes(2)
    expect(result).toBe(true)
  })

  it('watchPostEffect', async () => {
    const count = ref(0)
    let result
    const assertion = jest.fn(count => {
      result = serializeInner(root) === `${count}`
    })

    const Comp = {
      setup() {
        watchPostEffect(() => {
          assertion(count.value)
        })
        return () => count.value
      }
    }
    const root = nodeOps.createElement('div')
    render(h(Comp), root)
    expect(assertion).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)

    count.value++
    await nextTick()
    expect(assertion).toHaveBeenCalledTimes(2)
    expect(result).toBe(true)
  })

  it('flush timing: sync', async () => {
    const count = ref(0)
    const count2 = ref(0)

    let callCount = 0
    let result1
    let result2
    const assertion = jest.fn(count => {
      callCount++
      // on mount, the watcher callback should be called before DOM render
      // on update, should be called before the count is updated
      const expectedDOM = callCount === 1 ? `` : `${count - 1}`
      result1 = serializeInner(root) === expectedDOM

      // in a sync callback, state mutation on the next line should not have
      // executed yet on the 2nd call, but will be on the 3rd call.
      const expectedState = callCount < 3 ? 0 : 1
      result2 = count2.value === expectedState
    })

    const Comp = {
      setup() {
        watchEffect(
          () => {
            assertion(count.value)
          },
          {
            flush: 'sync'
          }
        )
        return () => count.value
      }
    }
    const root = nodeOps.createElement('div')
    render(h(Comp), root)
    expect(assertion).toHaveBeenCalledTimes(1)
    expect(result1).toBe(true)
    expect(result2).toBe(true)

    count.value++
    count2.value++
    await nextTick()
    expect(assertion).toHaveBeenCalledTimes(3)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('watchSyncEffect', async () => {
    const count = ref(0)
    const count2 = ref(0)

    let callCount = 0
    let result1
    let result2
    const assertion = jest.fn(count => {
      callCount++
      // on mount, the watcher callback should be called before DOM render
      // on update, should be called before the count is updated
      const expectedDOM = callCount === 1 ? `` : `${count - 1}`
      result1 = serializeInner(root) === expectedDOM

      // in a sync callback, state mutation on the next line should not have
      // executed yet on the 2nd call, but will be on the 3rd call.
      const expectedState = callCount < 3 ? 0 : 1
      result2 = count2.value === expectedState
    })

    const Comp = {
      setup() {
        watchSyncEffect(() => {
          assertion(count.value)
        })
        return () => count.value
      }
    }
    const root = nodeOps.createElement('div')
    render(h(Comp), root)
    expect(assertion).toHaveBeenCalledTimes(1)
    expect(result1).toBe(true)
    expect(result2).toBe(true)

    count.value++
    count2.value++
    await nextTick()
    expect(assertion).toHaveBeenCalledTimes(3)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should not fire on component unmount w/ flush: post', async () => {
    const toggle = ref(true)
    const cb = jest.fn()
    const Comp = {
      setup() {
        watch(toggle, cb, { flush: 'post' })
      },
      render() {}
    }
    const App = {
      render() {
        return toggle.value ? h(Comp) : null
      }
    }
    render(h(App), nodeOps.createElement('div'))
    expect(cb).not.toHaveBeenCalled()
    toggle.value = false
    await nextTick()
    expect(cb).not.toHaveBeenCalled()
  })

  it('should fire on component unmount w/ flush: pre', async () => {
    const toggle = ref(true)
    const cb = jest.fn()
    const Comp = {
      setup() {
        watch(toggle, cb, { flush: 'pre' })
      },
      render() {}
    }
    const App = {
      render() {
        return toggle.value ? h(Comp) : null
      }
    }
    render(h(App), nodeOps.createElement('div'))
    expect(cb).not.toHaveBeenCalled()
    toggle.value = false
    await nextTick()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  // #1763
  it('flush: pre watcher watching props should fire before child update', async () => {
    const a = ref(0)
    const b = ref(0)
    const c = ref(0)
    const calls: string[] = []

    const Comp = {
      props: ['a', 'b'],
      setup(props: any) {
        watch(
          () => props.a + props.b,
          () => {
            calls.push('watcher 1')
            c.value++
          },
          { flush: 'pre' }
        )

        // #1777 chained pre-watcher
        watch(
          c,
          () => {
            calls.push('watcher 2')
          },
          { flush: 'pre' }
        )
        return () => {
          c.value
          calls.push('render')
        }
      }
    }

    const App = {
      render() {
        return h(Comp, { a: a.value, b: b.value })
      }
    }

    render(h(App), nodeOps.createElement('div'))
    expect(calls).toEqual(['render'])

    // both props are updated
    // should trigger pre-flush watcher first and only once
    // then trigger child render
    a.value++
    b.value++
    await nextTick()
    expect(calls).toEqual(['render', 'watcher 1', 'watcher 2', 'render'])
  })

  // #1852
  it('flush: post watcher should fire after template refs updated', async () => {
    const toggle = ref(false)
    let dom: TestElement | null = null

    const App = {
      setup() {
        const domRef = ref<TestElement | null>(null)

        watch(
          toggle,
          () => {
            dom = domRef.value
          },
          { flush: 'post' }
        )

        return () => {
          return toggle.value ? h('p', { ref: domRef }) : null
        }
      }
    }

    render(h(App), nodeOps.createElement('div'))
    expect(dom).toBe(null)

    toggle.value = true
    await nextTick()
    expect(dom!.tag).toBe('p')
  })

  it('deep', async () => {
    const state = reactive({
      nested: {
        count: ref(0)
      },
      array: [1, 2, 3],
      map: new Map([
        ['a', 1],
        ['b', 2]
      ]),
      set: new Set([1, 2, 3])
    })

    let dummy
    watch(
      () => state,
      state => {
        dummy = [
          state.nested.count,
          state.array[0],
          state.map.get('a'),
          state.set.has(1)
        ]
      },
      { deep: true }
    )

    state.nested.count++
    await nextTick()
    expect(dummy).toEqual([1, 1, 1, true])

    // nested array mutation
    state.array[0] = 2
    await nextTick()
    expect(dummy).toEqual([1, 2, 1, true])

    // nested map mutation
    state.map.set('a', 2)
    await nextTick()
    expect(dummy).toEqual([1, 2, 2, true])

    // nested set mutation
    state.set.delete(1)
    await nextTick()
    expect(dummy).toEqual([1, 2, 2, false])
  })

  it('watching deep ref', async () => {
    const count = ref(0)
    const double = computed(() => count.value * 2)
    const state = reactive([count, double])

    let dummy
    watch(
      () => state,
      state => {
        dummy = [state[0].value, state[1].value]
      },
      { deep: true }
    )

    count.value++
    await nextTick()
    expect(dummy).toEqual([1, 2])
  })

  it('immediate', async () => {
    const count = ref(0)
    const cb = jest.fn()
    watch(count, cb, { immediate: true })
    expect(cb).toHaveBeenCalledTimes(1)
    count.value++
    await nextTick()
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('immediate: triggers when initial value is null', async () => {
    const state = ref(null)
    const spy = jest.fn()
    watch(() => state.value, spy, { immediate: true })
    expect(spy).toHaveBeenCalled()
  })

  it('immediate: triggers when initial value is undefined', async () => {
    const state = ref()
    const spy = jest.fn()
    watch(() => state.value, spy, { immediate: true })
    expect(spy).toHaveBeenCalled()
    state.value = 3
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(2)
    // testing if undefined can trigger the watcher
    state.value = undefined
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(3)
    // it shouldn't trigger if the same value is set
    state.value = undefined
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('warn immediate option when using effect', async () => {
    const count = ref(0)
    let dummy
    watchEffect(
      () => {
        dummy = count.value
      },
      // @ts-ignore
      { immediate: false }
    )
    expect(dummy).toBe(0)
    expect(`"immediate" option is only respected`).toHaveBeenWarned()

    count.value++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('warn and not respect deep option when using effect', async () => {
    const arr = ref([1, [2]])
    const spy = jest.fn()
    watchEffect(
      () => {
        spy()
        return arr
      },
      // @ts-ignore
      { deep: true }
    )
    expect(spy).toHaveBeenCalledTimes(1)
    ;(arr.value[1] as Array<number>)[0] = 3
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(`"deep" option is only respected`).toHaveBeenWarned()
  })

  it('onTrack', async () => {
    const events: DebuggerEvent[] = []
    let dummy
    const onTrack = jest.fn((e: DebuggerEvent) => {
      events.push(e)
    })
    const obj = reactive({ foo: 1, bar: 2 })
    watchEffect(
      () => {
        dummy = [obj.foo, 'bar' in obj, Object.keys(obj)]
      },
      { onTrack }
    )
    await nextTick()
    expect(dummy).toEqual([1, true, ['foo', 'bar']])
    expect(onTrack).toHaveBeenCalledTimes(3)
    expect(events).toMatchObject([
      {
        target: obj,
        type: TrackOpTypes.GET,
        key: 'foo'
      },
      {
        target: obj,
        type: TrackOpTypes.HAS,
        key: 'bar'
      },
      {
        target: obj,
        type: TrackOpTypes.ITERATE,
        key: ITERATE_KEY
      }
    ])
  })

  it('onTrigger', async () => {
    const events: DebuggerEvent[] = []
    let dummy
    const onTrigger = jest.fn((e: DebuggerEvent) => {
      events.push(e)
    })
    const obj = reactive({ foo: 1 })
    watchEffect(
      () => {
        dummy = obj.foo
      },
      { onTrigger }
    )
    await nextTick()
    expect(dummy).toBe(1)

    obj.foo++
    await nextTick()
    expect(dummy).toBe(2)
    expect(onTrigger).toHaveBeenCalledTimes(1)
    expect(events[0]).toMatchObject({
      type: TriggerOpTypes.SET,
      key: 'foo',
      oldValue: 1,
      newValue: 2
    })

    // @ts-ignore
    delete obj.foo
    await nextTick()
    expect(dummy).toBeUndefined()
    expect(onTrigger).toHaveBeenCalledTimes(2)
    expect(events[1]).toMatchObject({
      type: TriggerOpTypes.DELETE,
      key: 'foo',
      oldValue: 2
    })
  })

  it('should work sync', () => {
    const v = ref(1)
    let calls = 0

    watch(
      v,
      () => {
        ++calls
      },
      {
        flush: 'sync'
      }
    )

    expect(calls).toBe(0)
    v.value++
    expect(calls).toBe(1)
  })

  test('should force trigger on triggerRef when watching a shallow ref', async () => {
    const v = shallowRef({ a: 1 })
    let sideEffect = 0
    watch(v, obj => {
      sideEffect = obj.a
    })

    v.value = v.value
    await nextTick()
    // should not trigger
    expect(sideEffect).toBe(0)

    v.value.a++
    await nextTick()
    // should not trigger
    expect(sideEffect).toBe(0)

    triggerRef(v)
    await nextTick()
    // should trigger now
    expect(sideEffect).toBe(2)
  })

  // #2125
  test('watchEffect should not recursively trigger itself', async () => {
    const spy = jest.fn()
    const price = ref(10)
    const history = ref<number[]>([])
    watchEffect(() => {
      history.value.push(price.value)
      spy()
    })
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  // #2231
  test('computed refs should not trigger watch if value has no change', async () => {
    const spy = jest.fn()
    const source = ref(0)
    const price = computed(() => source.value === 0)
    watch(price, spy)
    source.value++
    await nextTick()
    source.value++
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  // https://github.com/vuejs/vue-next/issues/2381
  test('$watch should always register its effects with its own instance', async () => {
    let instance: ComponentInternalInstance | null
    let _show: Ref<boolean>

    const Child = defineComponent({
      render: () => h('div'),
      mounted() {
        instance = getCurrentInstance()
      },
      unmounted() {}
    })

    const Comp = defineComponent({
      setup() {
        const comp = ref<ComponentPublicInstance | undefined>()
        const show = ref(true)
        _show = show
        return { comp, show }
      },
      render() {
        return this.show
          ? h(Child, {
              ref: vm => void (this.comp = vm as ComponentPublicInstance)
            })
          : null
      },
      mounted() {
        // this call runs while Comp is currentInstance, but
        // the effect for this `$watch` should nontheless be registered with Child
        this.comp!.$watch(
          () => this.show,
          () => void 0
        )
      }
    })

    render(h(Comp), nodeOps.createElement('div'))

    expect(instance!).toBeDefined()
    expect(instance!.scope.effects).toBeInstanceOf(Array)
    // includes the component's own render effect AND the watcher effect
    expect(instance!.scope.effects.length).toBe(2)

    _show!.value = false

    await nextTick()
    await nextTick()

    expect(instance!.scope.effects[0].active).toBe(false)
  })

  test('this.$watch should pass `this.proxy` to watch source as the first argument ', () => {
    let instance: any
    const source = jest.fn()

    const Comp = defineComponent({
      render() {},
      created(this: any) {
        instance = this
        this.$watch(source, function () {})
      }
    })

    const root = nodeOps.createElement('div')
    createApp(Comp).mount(root)

    expect(instance).toBeDefined()
    expect(source).toHaveBeenCalledWith(instance)
  })

  test('should not leak `this.proxy` to setup()', () => {
    const source = jest.fn()

    const Comp = defineComponent({
      render() {},
      setup() {
        watch(source, () => {})
      }
    })

    const root = nodeOps.createElement('div')
    createApp(Comp).mount(root)
    // should not have any arguments
    expect(source.mock.calls[0]).toMatchObject([])
  })

  // #2728
  test('pre watcher callbacks should not track dependencies', async () => {
    const a = ref(0)
    const b = ref(0)
    const updated = jest.fn()

    const Child = defineComponent({
      props: ['a'],
      updated,
      watch: {
        a() {
          b.value
        }
      },
      render() {
        return h('div', this.a)
      }
    })

    const Parent = defineComponent({
      render() {
        return h(Child, { a: a.value })
      }
    })

    const root = nodeOps.createElement('div')
    createApp(Parent).mount(root)

    a.value++
    await nextTick()
    expect(updated).toHaveBeenCalledTimes(1)

    b.value++
    await nextTick()
    // should not track b as dependency of Child
    expect(updated).toHaveBeenCalledTimes(1)
  })

  test('watching keypath', async () => {
    const spy = jest.fn()
    const Comp = defineComponent({
      render() {},
      data() {
        return {
          a: {
            b: 1
          }
        }
      },
      watch: {
        'a.b': spy
      },
      created(this: any) {
        this.$watch('a.b', spy)
      },
      mounted(this: any) {
        this.a.b++
      }
    })

    const root = nodeOps.createElement('div')
    createApp(Comp).mount(root)

    await nextTick()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('watching sources: ref<any[]>', async () => {
    const foo = ref([1])
    const spy = jest.fn()
    watch(foo, () => {
      spy()
    })
    foo.value = foo.value.slice()
    await nextTick()
    expect(spy).toBeCalledTimes(1)
  })

  it('watching multiple sources: computed', async () => {
    let count = 0
    const value = ref('1')
    const plus = computed(() => !!value.value)
    watch([plus], () => {
      count++
    })
    value.value = '2'
    await nextTick()
    expect(plus.value).toBe(true)
    expect(count).toBe(0)
  })

  // #4158
  test('watch should not register in owner component if created inside detached scope', () => {
    let instance: ComponentInternalInstance
    const Comp = {
      setup() {
        instance = getCurrentInstance()!
        effectScope(true).run(() => {
          watch(
            () => 1,
            () => {}
          )
        })
        return () => ''
      }
    }
    const root = nodeOps.createElement('div')
    createApp(Comp).mount(root)
    // should not record watcher in detached scope and only the instance's
    // own update effect
    expect(instance!.scope.effects.length).toBe(1)
  })
})
