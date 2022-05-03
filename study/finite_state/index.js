// /abc/.test("a");

const test = (string) => {
  let i;
  let startIndex;
  let endIndex;
  const result = [];
  const waitForA = (char) => {
    if (char === "a") {
      startIndex = i;
      return waitForB;
    }
    return waitForA;
  };

  const waitForB = (char) => {
    if (char === "b") {
      return waitForC;
    }
    return waitForA;
  };

  const waitForC = (char) => {
    if (char === "c") {
      endIndex = i;
      return end;
    }
    return waitForA;
  };

  const end = () => {
    return end;
  };

  let currentState = waitForA;
  for (i = 0; i < string.length; i++) {
    let nextState = currentState(string[i]);
    currentState = nextState;

    if (currentState === end) {
      result.push([startIndex, endIndex]);
      console.log(result);
      currentState = waitForA;
      //   return true;
    }
  }
};

console.log(test("123abcabc"));
