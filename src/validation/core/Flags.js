'use strict';

export default class Flags {

  constructor() {
    this.reset();
  }

  reset() {
    this.touched = false; //indicates that the field has received AND lost focus.
    this.untouched = true; // indicates that the field has not received AND lost focus.
    this.dirty = false; // indicates that the field has been manipulated.
    this.pristine = true; // indicates that the field has not been manipulated.
    this.valid = true; // indicates that the field has passed the validation.
    this.invalid = false; // indicates that the field has failed the validation.
    this.pending = false; // indicates that the field validation is in progress.
    this.validated = false; // indicates that the field has been validated at least once by an event or manually using validate() or validateAll().
    this.changed = false; // indicates that the field value has been changed (strict check).
  }

  setValid(val) {
    this.valid = val;
    this.invalid = !val;
    this.setValidated(true);
  }

  setDirty(val) {
    this.dirty = val;
    this.pristine = !val;
  }

  setTouched(val) {
    this.touched = val;
    this.untouched = !val;
  }

  setPending(val) {
    this.pending = val;
  }

  setValidated(val) {
    this.validated = val;
  }

  setChanged(val) {
    this.changed = val;
  }

}
