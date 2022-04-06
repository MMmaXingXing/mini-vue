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

  // effect 实现runner，runner功能，实现一个方法，运行effect传入的fn，返回fn的结果
  // effect(fn) --> function (runner) --> fn --> return
  it("should return runner when effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);

    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});
