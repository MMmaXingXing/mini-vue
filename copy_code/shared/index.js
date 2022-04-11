export const extend = Object.assign;

export const isObject = (val) => {
  return val !== undefined && typeof val === "object";
};

export const hasChanged = (value, newValue) => {
  return !Object.is(value, newValue);
};
