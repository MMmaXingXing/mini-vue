import { mutableHandler, readonlyHandler } from "./baseHandler";

export const reactive = (raw) => {
  return new Proxy(raw, mutableHandler);
};

export const readonly = (raw) => {
  return new Proxy(raw, readonlyHandler);
};
