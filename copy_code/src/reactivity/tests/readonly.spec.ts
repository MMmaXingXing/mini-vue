import { readonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const original = {
      foo: 10
    };
    const observed = readonly(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(10);
  });

  it("warn with set", () => {
    console.warn = jest.fn();

    const dummp = readonly({ age: 10 });
    dummp.age++;
    expect(console.warn).toBeCalled();
  });
});
