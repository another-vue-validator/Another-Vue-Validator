'use strict';

export default class ValidationContext {

  constructor(options) {
    options = options || {};
    this.value = options.value === undefined ? undefined : options.value;
    this.path = options.path || '';
    this.parts = options.parts || [];
    this.prop = options.prop || '';
    this.pathToParent = getPathToParent(this.parts) || '';
  }
}

function getPathToParent(parts) {
  let clonedArrayWithoutProp = parts.slice(0, parts.length - 1);
  let path = clonedArrayWithoutProp.join('.');
  return path;
}
