import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = {
      foo: 10
    };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(10);
  });
});
