import { effect, stop } from "../effect";
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

  it("should return runner when effect", () => {
    // effect 实现runner，runner功能，实现一个方法，运行effect传入的fn，返回fn的结果
    // effect(fn) --> function (runner) --> fn --> return
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

  it("scheduler", () => {
    // 通过effect的第二个参数给定一个scheduler的一个fn
    // 当effect第一次执行的时候才会执行fn，当响应式对象发生第二次更新则会执行schaduler
    // 当执行runner的时候，会再次执行fn
    let dummy;
    let run;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);

    run();
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    // effect 导出一个stop方法，可以停止runner方法的运行，调用runner则又可以运行
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });

    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    // onStop是调用stop方法之后的回调处理
    const obj = reactive({
      foo: 1
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
