// Core API ------------------------------------------------------------------

export const version = __VERSION__
export {
  // core
  computed,
  reactive,
  ref,
  readonly,
  // utilities
  unref,
  proxyRefs,
  isRef,
  toRef,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  // advanced
  customRef,
  triggerRef,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  markRaw,
  toRaw,
  // effect
  effect,
  stop,
  ReactiveEffect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose
} from '@vue/reactivity'
export {
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect
} from './apiWatch'
export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onRenderTracked,
  onRenderTriggered,
  onErrorCaptured,
  onServerPrefetch
} from './apiLifecycle'
export { provide, inject } from './apiInject'
export { nextTick } from './scheduler'
export { defineComponent } from './apiDefineComponent'
export { defineAsyncComponent } from './apiAsyncComponent'
export { useAttrs, useSlots } from './apiSetupHelpers'

// <script setup> API ----------------------------------------------------------

export {
  // macros runtime, for typing and warnings only
  defineProps,
  defineEmits,
  defineExpose,
  withDefaults,
  // internal
  mergeDefaults,
  createPropsRestProxy,
  withAsyncContext
} from './apiSetupHelpers'

// Advanced API ----------------------------------------------------------------

// For getting a hold of the internal instance in setup() - useful for advanced
// plugins
export { getCurrentInstance } from './component'

// For raw render function users
export { h } from './h'
// Advanced render function utilities
export { createVNode, cloneVNode, mergeProps, isVNode } from './vnode'
// VNode types
export { Fragment, Text, Comment, Static } from './vnode'
// Built-in components
export { Teleport, TeleportProps } from './components/Teleport'
export { Suspense, SuspenseProps } from './components/Suspense'
export { KeepAlive, KeepAliveProps } from './components/KeepAlive'
export {
  BaseTransition,
  BaseTransitionProps
} from './components/BaseTransition'
// For using custom directives
export { withDirectives } from './directives'
// SSR context
export { useSSRContext, ssrContextKey } from './helpers/useSsrContext'

// Custom Renderer API ---------------------------------------------------------

export { createRenderer, createHydrationRenderer } from './renderer'
export { queuePostFlushCb } from './scheduler'
export { warn } from './warning'
export {
  handleError,
  callWithErrorHandling,
  callWithAsyncErrorHandling,
  ErrorCodes
} from './errorHandling'
export {
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent
} from './helpers/resolveAssets'
// For integration with runtime compiler
export { registerRuntimeCompiler, isRuntimeOnly } from './component'
export {
  useTransitionState,
  resolveTransitionHooks,
  setTransitionHooks,
  getTransitionRawChildren
} from './components/BaseTransition'
export { initCustomFormatter } from './customFormatter'

// For devtools
export { devtools, setDevtoolsHook } from './devtools'

// Types -------------------------------------------------------------------------

import { VNode } from './vnode'
import { ComponentInternalInstance } from './component'

// Augment Ref unwrap bail types.
// Note: if updating this, also update `types/refBail.d.ts`.
declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    runtimeCoreBailTypes:
      | VNode
      | {
          // directly bailing on ComponentPublicInstance results in recursion
          // so we use this as a bail hint
          $: ComponentInternalInstance
        }
  }
}

export {
  Ref,
  ToRef,
  ToRefs,
  UnwrapRef,
  ShallowRef,
  ShallowUnwrapRef,
  CustomRefFactory,
  ReactiveFlags,
  DeepReadonly,
  ShallowReactive,
  UnwrapNestedRefs,
  ComputedRef,
  WritableComputedRef,
  WritableComputedOptions,
  ComputedGetter,
  ComputedSetter,
  ReactiveEffectRunner,
  ReactiveEffectOptions,
  EffectScheduler,
  DebuggerOptions,
  DebuggerEvent,
  DebuggerEventExtraInfo,
  TrackOpTypes,
  TriggerOpTypes
} from '@vue/reactivity'
export {
  WatchEffect,
  WatchOptions,
  WatchOptionsBase,
  WatchCallback,
  WatchSource,
  WatchStopHandle
} from './apiWatch'
export { InjectionKey } from './apiInject'
export {
  App,
  AppConfig,
  AppContext,
  Plugin,
  CreateAppFunction,
  OptionMergeFunction
} from './apiCreateApp'
export {
  VNode,
  VNodeChild,
  VNodeTypes,
  VNodeProps,
  VNodeArrayChildren,
  VNodeNormalizedChildren
} from './vnode'
export {
  Component,
  ConcreteComponent,
  FunctionalComponent,
  ComponentInternalInstance,
  SetupContext,
  ComponentCustomProps,
  AllowedComponentProps
} from './component'
export { DefineComponent } from './apiDefineComponent'
export {
  ComponentOptions,
  ComponentOptionsMixin,
  ComponentOptionsWithoutProps,
  ComponentOptionsWithObjectProps,
  ComponentOptionsWithArrayProps,
  ComponentCustomOptions,
  ComponentOptionsBase,
  RenderFunction,
  MethodOptions,
  ComputedOptions,
  RuntimeCompilerOptions
} from './componentOptions'
export { EmitsOptions, ObjectEmitsOptions } from './componentEmits'
export {
  ComponentPublicInstance,
  ComponentCustomProperties,
  CreateComponentPublicInstance
} from './componentPublicInstance'
export {
  Renderer,
  RendererNode,
  RendererElement,
  HydrationRenderer,
  RendererOptions,
  RootRenderFunction
} from './renderer'
export { RootHydrateFunction } from './hydration'
export { Slot, Slots } from './componentSlots'
export {
  Prop,
  PropType,
  ComponentPropsOptions,
  ComponentObjectPropsOptions,
  ExtractPropTypes,
  ExtractDefaultPropTypes
} from './componentProps'
export {
  Directive,
  DirectiveBinding,
  DirectiveHook,
  ObjectDirective,
  FunctionDirective,
  DirectiveArguments
} from './directives'
export { SuspenseBoundary } from './components/Suspense'
export { TransitionState, TransitionHooks } from './components/BaseTransition'
export {
  AsyncComponentOptions,
  AsyncComponentLoader
} from './apiAsyncComponent'
export { HMRRuntime } from './hmr'

// Internal API ----------------------------------------------------------------

// **IMPORTANT** Internal APIs may change without notice between versions and
// user code should avoid relying on them.

// For compiler generated code
// should sync with '@vue/compiler-core/src/runtimeHelpers.ts'
export {
  withCtx,
  pushScopeId,
  popScopeId,
  withScopeId
} from './componentRenderContext'
export { renderList } from './helpers/renderList'
export { toHandlers } from './helpers/toHandlers'
export { renderSlot } from './helpers/renderSlot'
export { createSlots } from './helpers/createSlots'
export { withMemo, isMemoSame } from './helpers/withMemo'
export {
  openBlock,
  createBlock,
  setBlockTracking,
  createTextVNode,
  createCommentVNode,
  createStaticVNode,
  createElementVNode,
  createElementBlock,
  guardReactiveProps
} from './vnode'
export {
  toDisplayString,
  camelize,
  capitalize,
  toHandlerKey,
  normalizeProps,
  normalizeClass,
  normalizeStyle
} from '@vue/shared'

// For test-utils
export { transformVNodeArgs } from './vnode'

// SSR -------------------------------------------------------------------------

// **IMPORTANT** These APIs are exposed solely for @vue/server-renderer and may
// change without notice between versions. User code should never rely on them.

import { createComponentInstance, setupComponent } from './component'
import { renderComponentRoot } from './componentRenderUtils'
import { setCurrentRenderingInstance } from './componentRenderContext'
import { isVNode, normalizeVNode } from './vnode'

const _ssrUtils = {
  createComponentInstance,
  setupComponent,
  renderComponentRoot,
  setCurrentRenderingInstance,
  isVNode,
  normalizeVNode
}

/**
 * SSR utils for \@vue/server-renderer. Only exposed in cjs builds.
 * @internal
 */
export const ssrUtils = (__SSR__ ? _ssrUtils : null) as typeof _ssrUtils

// 2.x COMPAT ------------------------------------------------------------------

export { DeprecationTypes } from './compat/compatConfig'
export { CompatVue } from './compat/global'
export { LegacyConfig } from './compat/globalConfig'

import { warnDeprecation } from './compat/compatConfig'
import { createCompatVue } from './compat/global'
import {
  isCompatEnabled,
  checkCompatEnabled,
  softAssertCompatEnabled
} from './compat/compatConfig'
import { resolveFilter as _resolveFilter } from './helpers/resolveAssets'

/**
 * @internal only exposed in compat builds
 */
export const resolveFilter = __COMPAT__ ? _resolveFilter : null

const _compatUtils = {
  warnDeprecation,
  createCompatVue,
  isCompatEnabled,
  checkCompatEnabled,
  softAssertCompatEnabled
}

/**
 * @internal only exposed in compat builds.
 */
export const compatUtils = (
  __COMPAT__ ? _compatUtils : null
) as typeof _compatUtils
