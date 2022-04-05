import { effect } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    // 1、创建一个响应式对象
    const user = reactive({
      age: 10
    });

    // 2、依赖搜集 & 触发依赖
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    //update
    user.age++;
    expect(nextAge).toBe(12);
  });
});
