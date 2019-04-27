'use strict';

import Flags from './Flags';
import * as utils from '../utils/utils';
import ValidationContext from './ValidationContext';

export default class Field {

  constructor(options = {initialValue: null, flags: undefined, errors: [], validationContext: null, keypath: null}) {

    if (options.keypath == null && options.validationContext == null) {
      throw new Error('keypath must be provided');
    }

    if (options.validationContext == null) {
      let contextOptions = utils.splitKeypath(options.keypath);
      options.validationContext = new ValidationContext( contextOptions );
    }

    this.errorList = options.errors || [];
    this.keypath = options.validationContext.path;
    this.name = options.validationContext.prop;
    this.initialValue = this.value = options.initialValue;
    this.flags = options.flags || new Flags();
    this.validating = false;
    this.validatingId = null;
    this.dependencies = [];

    if (this.flags == null) {
      this.flags = new Flags();
    }
  }


  /**
   *
   * @returns {Flags}
   */
  getFlags() {
    return this.flags;
  }

  setFlags(flags) {
    for (let flag in flags) {
      if (this.flags[flag] != null) {
        // TODO this should probably call the methods setDirty etc instead of flags directly so as to inforce logic in the set methods
        this.flags[flag] = flags[flag];
      }
    }
  }

  reset() {
    this.flags.reset();
    this.value = this.initialValue;
    this.removeErrors();
    this.resetValidating();
  }

  removeErrors() {
    this.errorList = [];
    this.flags.setValid(true);
  }

  setInitialValue(val) {
    this.initialValue = val;
    this.setValue(this.value);
  }

  setValue(val) {
    this.value = val;
    if (this.initialValue !== val) {
      this.flags.setDirty(true);
      this.flags.setChanged(true);
    } else {
      this.flags.setChanged(false);
    }
  }

  // checkValueChanged() {
  //   if (this.initialValue === null && this.value === null) {
  //     return false;
  //   }
  //   return this.value !== this.initialValue;
  // }

  hasError() {
    return this.errorList.length > 0;
  }

  addError(msg) {
    this.flags.setValid(false);
    this.errorList.push(msg);
  }


  firstError() {
    return this.errorList[0];
  }

  errors() {
    return this.errorList;
  }

  setValidating(val) {
    this.validating = val;
    this.flags.setPending(val);
  }

  isValidating() {
    return this.validating;
  }

  isIdValidating(id) {
    if (id === this.getValidatingId()) {
      return true;
    }
    return false;
  }

  setValidatingId(val) {
    this.validatingId = val;
  }

  getValidatingId() {
    return this.validatingId;
  }

  resetValidating() {
    this.setValidatingId(null);
    this.setValidating(false);
  }

  getDependencies() {
    return this.dependencies;
  }

  setDependencies(deps = []) {
    this.dependencies = deps;
  }
}
