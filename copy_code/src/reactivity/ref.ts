import { isTracking, trackEffects, trigger, triggerEffects } from "./effect";
import { isObject, hasChanged } from "../../shared";
import { reactive } from "./reactive";

class RefImpl {
  private _value;
  private _rawValue;
  public __v_isRef = true;
  public dep;
  constructor(value) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(this._rawValue, newValue)) {
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

export const ref = (value) => {
  return new RefImpl(value);
};

export const isRef = (ref) => {
  return !!ref.__v_isRef;
};

export const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
};

export const proxyRefs = (objectWithRef) => {
  return new Proxy(objectWithRef, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    }
  });
};
