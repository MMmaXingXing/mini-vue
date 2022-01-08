import { patchProp } from '../src/patchProp'
import { render, h } from '../src'

describe('runtime-dom: props patching', () => {
  test('basic', () => {
    const el = document.createElement('div')
    patchProp(el, 'id', null, 'foo')
    expect(el.id).toBe('foo')
    // prop with string value should be set to empty string on null values
    patchProp(el, 'id', null, null)
    expect(el.id).toBe('')
    expect(el.getAttribute('id')).toBe(null)
  })

  test('value', () => {
    const el = document.createElement('input')
    patchProp(el, 'value', null, 'foo')
    expect(el.value).toBe('foo')
    patchProp(el, 'value', null, null)
    expect(el.value).toBe('')
    expect(el.getAttribute('value')).toBe(null)
    const obj = {}
    patchProp(el, 'value', null, obj)
    expect(el.value).toBe(obj.toString())
    expect((el as any)._value).toBe(obj)
  })

  test('value for custom elements', () => {
    class TestElement extends HTMLElement {
      constructor() {
        super()
      }

      // intentionally uses _value because this is used in "normal" HTMLElement for storing the object of the set property value
      private _value: any
      get value() {
        return this._value
      }

      set value(val) {
        this._value = val
        this.setterCalled++
      }

      public setterCalled: number = 0
    }
    window.customElements.define('test-element', TestElement)
    const el = document.createElement('test-element') as TestElement
    patchProp(el, 'value', null, 'foo')
    expect(el.value).toBe('foo')
    expect(el.setterCalled).toBe(1)
    patchProp(el, 'value', null, null)
    expect(el.value).toBe('')
    expect(el.setterCalled).toBe(2)
    expect(el.getAttribute('value')).toBe(null)
    const obj = {}
    patchProp(el, 'value', null, obj)
    expect(el.value).toBe(obj)
    expect(el.setterCalled).toBe(3)
  })

  // For <input type="text">, setting el.value won't create a `value` attribute
  // so we need to add tests for other elements
  test('value for non-text input', () => {
    const el = document.createElement('option')
    el.textContent = 'foo' // #4956
    patchProp(el, 'value', null, 'foo')
    expect(el.getAttribute('value')).toBe('foo')
    expect(el.value).toBe('foo')
    patchProp(el, 'value', null, null)
    el.textContent = ''
    expect(el.value).toBe('')
    // #3475
    expect(el.getAttribute('value')).toBe(null)
  })

  test('boolean prop', () => {
    const el = document.createElement('select')
    patchProp(el, 'multiple', null, '')
    expect(el.multiple).toBe(true)
    patchProp(el, 'multiple', null, null)
    expect(el.multiple).toBe(false)
    patchProp(el, 'multiple', null, true)
    expect(el.multiple).toBe(true)
    patchProp(el, 'multiple', null, 0)
    expect(el.multiple).toBe(false)
    patchProp(el, 'multiple', null, '0')
    expect(el.multiple).toBe(true)
    patchProp(el, 'multiple', null, false)
    expect(el.multiple).toBe(false)
    patchProp(el, 'multiple', null, 1)
    expect(el.multiple).toBe(true)
    patchProp(el, 'multiple', null, undefined)
    expect(el.multiple).toBe(false)
  })

  test('innerHTML unmount prev children', () => {
    const fn = jest.fn()
    const comp = {
      render: () => 'foo',
      unmounted: fn
    }
    const root = document.createElement('div')
    render(h('div', null, [h(comp)]), root)
    expect(root.innerHTML).toBe(`<div>foo</div>`)

    render(h('div', { innerHTML: 'bar' }), root)
    expect(root.innerHTML).toBe(`<div>bar</div>`)
    expect(fn).toHaveBeenCalled()
  })

  // #954
  test('(svg) innerHTML unmount prev children', () => {
    const fn = jest.fn()
    const comp = {
      render: () => 'foo',
      unmounted: fn
    }
    const root = document.createElement('div')
    render(h('div', null, [h(comp)]), root)
    expect(root.innerHTML).toBe(`<div>foo</div>`)

    render(h('svg', { innerHTML: '<g></g>' }), root)
    expect(root.innerHTML).toBe(`<svg><g></g></svg>`)
    expect(fn).toHaveBeenCalled()
  })

  test('textContent unmount prev children', () => {
    const fn = jest.fn()
    const comp = {
      render: () => 'foo',
      unmounted: fn
    }
    const root = document.createElement('div')
    render(h('div', null, [h(comp)]), root)
    expect(root.innerHTML).toBe(`<div>foo</div>`)

    render(h('div', { textContent: 'bar' }), root)
    expect(root.innerHTML).toBe(`<div>bar</div>`)
    expect(fn).toHaveBeenCalled()
  })

  // #1049
  test('set value as-is for non string-value props', () => {
    const el = document.createElement('video')
    // jsdom doesn't really support video playback. srcObject in a real browser
    // should default to `null`, but in jsdom it's `undefined`.
    // anyway, here we just want to make sure Vue doesn't set non-string props
    // to an empty string on nullish values - it should reset to its default
    // value.
    const initialValue = el.srcObject
    const fakeObject = {}
    patchProp(el, 'srcObject', null, fakeObject)
    expect(el.srcObject).not.toBe(fakeObject)
    patchProp(el, 'srcObject', null, null)
    expect(el.srcObject).toBe(initialValue)
  })

  test('catch and warn prop set TypeError', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'someProp', {
      set() {
        throw new TypeError('Invalid type')
      }
    })
    patchProp(el, 'someProp', null, 'foo')

    expect(`Failed setting prop "someProp" on <div>`).toHaveBeenWarnedLast()
  })

  // #1576
  test('remove attribute when value is falsy', () => {
    const el = document.createElement('div')
    patchProp(el, 'id', null, '')
    expect(el.hasAttribute('id')).toBe(true)
    patchProp(el, 'id', null, null)
    expect(el.hasAttribute('id')).toBe(false)

    patchProp(el, 'id', null, '')
    expect(el.hasAttribute('id')).toBe(true)
    patchProp(el, 'id', null, undefined)
    expect(el.hasAttribute('id')).toBe(false)

    patchProp(el, 'id', null, '')
    expect(el.hasAttribute('id')).toBe(true)

    // #2677
    const img = document.createElement('img')
    patchProp(img, 'width', null, '')
    expect(el.hasAttribute('width')).toBe(false)
    patchProp(img, 'width', null, 0)
    expect(img.hasAttribute('width')).toBe(true)

    patchProp(img, 'width', null, null)
    expect(img.hasAttribute('width')).toBe(false)
    patchProp(img, 'width', null, 0)
    expect(img.hasAttribute('width')).toBe(true)

    patchProp(img, 'width', null, undefined)
    expect(img.hasAttribute('width')).toBe(false)
    patchProp(img, 'width', null, 0)
    expect(img.hasAttribute('width')).toBe(true)
  })

  test('form attribute', () => {
    const el = document.createElement('input')
    patchProp(el, 'form', null, 'foo')
    // non existant element
    expect(el.form).toBe(null)
    expect(el.getAttribute('form')).toBe('foo')
    // remove attribute
    patchProp(el, 'form', 'foo', null)
    expect(el.getAttribute('form')).toBe(null)
  })

  test('readonly type prop on textarea', () => {
    const el = document.createElement('textarea')
    // just to verify that it doesn't throw when i.e. switching a dynamic :is from an 'input' to a 'textarea'
    // see https://github.com/vuejs/vue-next/issues/2766
    patchProp(el, 'type', 'text', null)
  })

  test('force patch as prop', () => {
    const el = document.createElement('div') as any
    patchProp(el, '.x', null, 1)
    expect(el.x).toBe(1)
  })

  test('force patch as attribute', () => {
    const el = document.createElement('div') as any
    el.x = 1
    patchProp(el, '^x', null, 2)
    expect(el.x).toBe(1)
    expect(el.getAttribute('x')).toBe('2')
  })

  test('input with size', () => {
    const el = document.createElement('input')
    patchProp(el, 'size', null, 100)
    expect(el.size).toBe(100)
    patchProp(el, 'size', 100, null)
    expect(el.getAttribute('size')).toBe(null)
  })

  test('patch value for select', () => {
    const root = document.createElement('div')
    render(
      h('select', { value: 'foo' }, [
        h('option', { value: 'foo' }, 'foo'),
        h('option', { value: 'bar' }, 'bar')
      ]),
      root
    )
    const el = root.children[0] as HTMLSelectElement
    expect(el.value).toBe('foo')

    render(
      h('select', { value: 'baz' }, [
        h('option', { value: 'foo' }, 'foo'),
        h('option', { value: 'baz' }, 'baz')
      ]),
      root
    )
    expect(el.value).toBe('baz')
  })
})
