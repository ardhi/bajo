function isClass (item) {
  return typeof item === 'function' &&
    Object.prototype.hasOwnProperty.call(item, 'prototype') &&
    !Object.prototype.hasOwnProperty.call(item, 'arguments')
}

export default isClass
