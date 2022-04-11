import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: any;
  private _dirty = true;
  private _value: any;
  private _effect: any;
  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export const computed = (getter) => {
  return new ComputedRefImpl(getter);
};
