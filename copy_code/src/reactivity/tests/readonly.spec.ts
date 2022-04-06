import { readonly, reactive, isReadonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const original = {
      foo: 10
    };
    const reactiveVal = reactive(original);
    const observed = readonly(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(10);
    expect(isReadonly(observed)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(reactiveVal)).toBe(false);
  });

  it("warn with set", () => {
    console.warn = jest.fn();

    const dummp = readonly({ age: 10 });
    dummp.age++;
    expect(console.warn).toBeCalled();
  });
});
