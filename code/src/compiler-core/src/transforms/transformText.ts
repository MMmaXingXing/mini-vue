import { NodeTypes } from "../ast";
import { isText } from "../utils";

export const transformText = (node) => {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      let currentContainer;
      const { children } = node;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            if (isText(nextChild)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child]
                };
              }

              currentContainer.children.push(" + ");
              currentContainer.children.push(nextChild);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
};
