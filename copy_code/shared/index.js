export const extend = Object.assign;

export const isObject = (val) => {
  return val !== undefined && typeof val === "object";
};

export const hasChanged = (value, newValue) => {
  Object.is(value.newValue);
};
