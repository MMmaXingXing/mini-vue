import { effect } from "../effect";
import { reactive } from "../reactive";
import { ref, isRef, unRef, proxyRefs } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("shoud be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;

    effect(() => {
      calls++;
      dummy = a.value;
    });

    expect(calls).toBe(1);
    expect(dummy).toBe(1);

    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);

    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    // 对象类型深度监听
    const a = ref({
      count: 1
    });

    let dummy;
    effect(() => {
      dummy = a.value.count;
    });

    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({ age: 1 });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(1).toBe(1);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong"
    };

    // 取值测试
    const proxyUsers = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUsers.age).toBe(10);
    expect(proxyUsers.name).toBe("xiaohong");

    // 设置值测试
    proxyUsers.age = 20;
    expect(proxyUsers.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUsers.age = ref(10);
    expect(proxyUsers.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
