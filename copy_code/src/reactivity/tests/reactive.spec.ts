import { isReactive, reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = {
      foo: 10,
      bar: [{ name: 1 }]
    };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(10);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(observed.bar)).toBe(true);
    expect(isReactive(observed.bar[0])).toBe(true);
  });
});
