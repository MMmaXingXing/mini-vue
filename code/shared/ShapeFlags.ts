export const enum ShapeFlags {
  ELEMENT = 1, // 01
  STATEFUL_COMPONENT = 1 << 1, // 10
  TEXT_CHILDREN = 1 << 2, // 100
  ARRAY_CHILDREN = 1 << 3 // 1000
}
