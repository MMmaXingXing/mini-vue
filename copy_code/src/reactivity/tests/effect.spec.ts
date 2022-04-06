import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    user.age++;
    expect(nextAge).toBe(12);
  });

  // runner可以运行传入effect的fn，运行完成后返回fn的值
  it("runner", () => {
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

  // scheduler实现，effect入参传入schedular，如果存在，则更新时运行scheduler，不运行run。
  it("schedular", () => {
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
    const obj = reactive({ prop: 1 });

    let dummy;
    const runner = effect(() => {
      dummy = obj.prop;
    });

    expect(dummy).toBe(1);

    obj.prop = 2;
    expect(dummy).toBe(2);

    stop(runner);
    obj.prop++;
    expect(dummy).toBe(2);

    runner();
    obj.prop++;
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
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
