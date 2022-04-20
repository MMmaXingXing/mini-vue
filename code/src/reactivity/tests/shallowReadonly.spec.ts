import { isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
  test("should not make non-reactive properties reactive", () => {
    // 只有表层转换为响应式对象
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });
});
