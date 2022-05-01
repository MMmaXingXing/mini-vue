export const shouldUpdateComponent = (prevVNode, nextVNode) => {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  for (let key in nextProps) {
    if (nextProps[key] !== prevProps[key]) return true;
  }

  return false;
};
