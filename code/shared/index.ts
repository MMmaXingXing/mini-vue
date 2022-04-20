export const extend = Object.assign;

export const isObject = (val) => {
  return val !== undefined && typeof val === "object";
};

export const hasChange = (value, newValue) => {
  return !Object.is(value, newValue);
};

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
