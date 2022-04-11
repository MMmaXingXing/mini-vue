export const createVNode = (type, props?, children?) => {
  const vnode = {
    type,
    props,
    children
  };
  return vnode;
};
