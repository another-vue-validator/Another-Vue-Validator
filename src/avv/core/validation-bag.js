'use strict';

import * as utils from '../utils/utils';
import Field from './Field';

function ValidationBag(options = {}) {

  // if (options.vm == null) {
  //   throw new Error('');
  // }

  this.sessionId = 0; // async validator will check this before adding error
  this.resetting = 0; // do not allow to add error while reset is in progress

  /**
   *
   * @type { Object.<string, Field> }
   */
  this.fields = {};
  // this.validatingRecords = [];
  // this.passedRecords = [];
  // this.touchedRecords = [];
  this.activated = false; // set when $validate() is call, this flag works with the conservative mode
  this._vm = options.vm;
}

ValidationBag.prototype._setVM = function(vm) {
  this._vm = vm;
};

ValidationBag.prototype.addField = function (options) {

  // if (this.resetting) {
  //   throw new Error('Cannot add field while resetting');
  // }

  let field = new Field(options);

  // Add reactive field using Vue.set
  this._vm.$set(this.fields, options.validationContext.path, field);

  return field;
};

ValidationBag.prototype.addError = function (keypath, message) {
  if (this.resetting) {
    return;
  }

  let field = this.getField(keypath);
  if (field) {
    field.addError(message);
  }
};

ValidationBag.prototype.getField = function (keypath) {
  if (keypath == null) {
    throw new Error('keypath cannot be null');
  }

  let field = this.fields[keypath];
  return field;
};

ValidationBag.prototype.removeErrors = function (keypath) {

  if (keypath == null) {
    Object.values(this.fields).forEach(field => field.removeErrors());

  } else {
    let field = this.getField(keypath);
    if (field) {
      field.removeErrors();
    }
  }
};

ValidationBag.prototype.hasError = function (keypath) {

  if (keypath == null) {
    let fields = Object.values(this.fields);
    let result = fields.some(field => field.hasError());
    return result;
  }

  let field = this.getField(keypath);
  if (field) {
    return field.hasError();
  }
  return false;
};

ValidationBag.prototype.firstError = function (keypath) {

  if (keypath == null) {
    for (let key in this.fields) {
      let field = this.fields[key];
      let error = field.firstError();
      if (error) {
        return error;
      }
    }
  }

  let field = this.fields[keypath];
  if (field) {
    return field.firstError();
  }
  return null;
};

ValidationBag.prototype.allErrorFields = function (keypath) {
  if (keypath) {
    return this.fields[keypath];
  } else {
    return Object.values(this.fields).map(field => {
      return field;
    });
  }
}

ValidationBag.prototype.allErrors = function (keypath) {
  if (keypath) {
    return this.fields[keypath].errors();
  } else {
    return Object.values(this.fields).map(field => {
      return field.errors();
    });
  }
};

ValidationBag.prototype.countErrors = function (keypath) {

  if (keypath) {
    let field = this.fields[keypath];
    if (field) {
      return field.errors().length;
    }

  } else {

    let sum = 0;
    Object.values(this.fields).forEach(field => {
      sum += field.errors().length;
    });

    return sum;
  }
};

ValidationBag.prototype.setValidating = function (keypath, id) {
  if (this.resetting) {
    return;
  }

  id = id || ValidationBag.newValidatingId();
  let field = this.getField(keypath);

  if (field) {
    if (field.getValidatingId() === id) {
      throw new Error('Validating id already set: ' + id);
    }

    field.setValidatingId(id);
    field.setValidating(true);
    return id;
  }
};

ValidationBag.prototype.resetValidating = function (keypath) {

  if (keypath) {
    let field = this.getField(keypath);
    if (field) {
      field.resetValidating();
    }

  } else {
    // TODO will this ever execute since keypath always exist?
    Object.values(this.fields).forEach(field => field.resetValidating());
  }
};

ValidationBag.prototype.isValidating = function (keypath, id) {
  let field = this.getField(keypath);
  if (!field) {
    return false;
  }

  if (id == null) {
    return field.isValidating();

  } else {
    return field.isIdValidating(id);
  }
};

ValidationBag.prototype._isFlag = function (keypath, flag) {
  if (keypath) {
    let field = this.getField(keypath);
    if (field) {
      let flags = field.getFlags();
      return flags[flag];
    }
    return false;

  } else {
    for (let key in this.fields) {
      let field = this.fields[key];
      let flags = field.getFlags();

      if (flags[flag]) {
        return true;
      }
    }
    return false;
  }
};


ValidationBag.prototype.show = function (keypath, flags) {
  let err = this.hasError(keypath);

  let field = this.getField(keypath);
  if (!field) {
    return false;
  }

  // TODO perhaps specify per/field flags to show or not to?
  // Then if we don't use v-validate we can use different set of flags to show and if we do use v-validate use another set of flags
  if (flags) {

    let passed = flags.filter(flag => this._isFlag(keypath, flag));
    return err && passed.length > 0;
  }

  // First criteria to show error
  if (err && this.activated) {
    return true;
  }

  let touched = this.isTouched(keypath);
  let dirty = this.isDirty(keypath);


  //let validated = this.isValidated(keypath);
  //if (err && validated) return true;

  // Second criteria to show error
  if (err && touched && dirty) {
    return true;
  }
  return false;
};

ValidationBag.prototype.forceShow = function (keypath) {
  this.setTouched(keypath, true);
  this.setDirty(keypath, true);
};

ValidationBag.prototype.isValid = function (keypath) {
  return !this._isFlag(keypath, 'invalid');
};

ValidationBag.prototype.isInvalid = function (keypath) {
  return this._isFlag(keypath, 'invalid');
};

ValidationBag.prototype.isPristine = function (keypath) {
  return !this._isFlag(keypath, 'dirty');
};

ValidationBag.prototype.isDirty = function (keypath) {
  return this._isFlag(keypath, 'dirty');
};

ValidationBag.prototype.isTouched = function (keypath) {
  return this._isFlag(keypath, 'touched');
};

ValidationBag.prototype.isUntouched = function (keypath) {
  return !this._isFlag(keypath, 'touched');
};

ValidationBag.prototype.isValidated = function (keypath) {
  return this._isFlag(keypath, 'validated');
};

ValidationBag.prototype.isChanged = function (keypath) {
  return this._isFlag(keypath, 'changed');
};

ValidationBag.prototype.isPending = function (keypath) {
  return this._isFlag(keypath, 'pending');
};

ValidationBag.prototype.setFlag = function (keypath, flag, val) {
  if (val == null) {
    throw new Error(flag + ' accepts true/false as argument');
  }
  if (this.resetting) {
    return;
  }

  let field = this.getField(keypath);
  if (field) {
    field.getFlags()[flag](val);
  }
};

// ValidationBag.prototype.setInvalid = function (keypath) {
//   this.setFlag(keypath, 'setValid', false)
// }

ValidationBag.prototype.setValid = function (keypath, val) {
  this.setFlag(keypath, 'setValid', val);
};

// ValidationBag.prototype.setPristine = function (keypath, val) {
//   this.setFlag(keypath, 'setDirty', val)
// }

ValidationBag.prototype.setDirty = function (keypath, val) {
  this.setFlag(keypath, 'setDirty', val);
};

ValidationBag.prototype.setTouched = function (keypath, val) {
  this.setFlag(keypath, 'setTouched', val);
};

// ValidationBag.prototype.setUntouched = function (keypath) {
//   this.setFlag(keypath, 'setTouched', false)
// }

ValidationBag.prototype.setPending = function (keypath, val) {
  this.setFlag(keypath, 'setPending', val);
};

ValidationBag.prototype.setValidated = function (keypath, val) {
  this.setFlag(keypath, 'setValidated', val);
};

ValidationBag.prototype.setChanged = function (keypath, val) {
  this.setFlag(keypath, 'setChanged', val);
};

// ValidationBag.prototype.setPassed = function (field) {
//   if (this.resetting) {
//     return;
//   }
//   setValue(this.passedRecords, field);
// };
//
// ValidationBag.prototype.resetPassed = function (field) {
//   resetValue(this.passedRecords, field);
// };
//
// ValidationBag.prototype.isPassed = function (field) {
//   return isValueSet(this.passedRecords, field);
// };
//
// ValidationBag.prototype.setTouched = function (field) {
//   if (this.resetting) {
//     return;
//   }
//   setValue(this.touchedRecords, field);
// };
//
// ValidationBag.prototype.resetTouched = function (field) {
//   resetValue(this.touchedRecords, field);
// };
//
// ValidationBag.prototype.isTouched = function (field) {
//   return isValueSet(this.touchedRecords, field);
// };
//
// function setValue(records, field) {
//   var existingRecords = records.filter(function (record) {
//     return record.field === field;
//   });
//   if (!utils.isEmpty(existingRecords)) {
//     existingRecords[0].value = true;
//   } else {
//     records.push({field: field, value: true});
//   }
// }
//
// function resetValue(records, field) {
//   if (!field) {
//     records.splice(0, records.length);
//     return;
//   }
//   var existingRecords = records.filter(function (record) {
//     return record.field === field;
//   });
//   if (!utils.isEmpty(existingRecords)) {
//     existingRecords[0].value = false;
//   }
// }
//
// function isValueSet(records, field) {
//   var existingRecords = records.filter(function (record) {
//     return record.field === field;
//   });
//   return !utils.isEmpty(existingRecords) && existingRecords[0].value;
// }

ValidationBag.prototype.reset = function (keypath) {

  if (keypath) {
    let field = this.getField(keypath);
    if (field) {
      field.reset();
    }
    return;
  }

  this.sessionId++;
  Object.values(this.fields).forEach(field => field.reset());

  // this.validatingRecords = [];
  // this.passedRecords = [];
  // this.touchedRecords = [];

  // prevent field updates at the same tick to change validation status
  this.resetting++;
  this._vm.$nextTick(function () {
    this.resetting--;
  }.bind(this));

  this.activated = false;
};

// returns true if any error is added
ValidationBag.prototype.setError = function (keypath, message) {
  if (this.resetting) {
    return;
  }

  this.removeErrors(keypath);

  let _addMessages = addMessages.bind(this);
  let _setAsyncMessages = setAsyncMessages.bind(this);

  let messages = utils.isArray(message) ? message : [message];

  var hasPromise = messages.filter(function (message) {
    return message && message.then;
  }).length > 0;

  if (hasPromise) {
    return _setAsyncMessages(keypath, messages);

  } else {
    let hasError = _addMessages(keypath, messages);
    return Promise.resolve(hasError);
  }
};

ValidationBag.prototype.checkRule = function (rule) {
  if (this.resetting) {
    return;
  }
  // Promise resolve with value hasError -> true or false
  let promise = this.setError(rule._field, rule._messages);
  return promise;
};

function setAsyncMessages(keypath, messages) {
  /* jshint validthis:true */

  // if message is promise, we are encountering async validation, set validating flag and wait for message to resolve
  // reset previous validating status for this keypath
  this.resetValidating(keypath);
  var validatingId = this.setValidating(keypath);
  var always = function () {
    //console.log(validatingId + ' | ' + 'end');
    this.resetValidating(keypath);
  }.bind(this);
  //console.log(validatingId + ' | ' + 'start');

  return Promise.all(messages)
    .then((messages) => {

      // check if the validating id is is still valid
      if (this.isValidating(keypath, validatingId)) {
        //console.log(validatingId + ' | ' + 'processed');

        let _addMessages = addMessages.bind(this);
        return _addMessages(keypath, messages);
      }
      return false;
    }).bind(this)

    .then(function (result) {
      always();
      return result;
    })
    .catch(function (e) {
      always();
      return Promise.reject(e);
    }.bind(this));
}

function addMessages(keypath, messages) {
  /*jshint validthis:true */
  let hasError = false;
  messages.forEach(function (message) {

    if (message) {
      this.addError(keypath, message);
      hasError = true;
    }
  }, this);

  // if (!hasError) {
  //   this.setPassed(keypath);
  // }
  return hasError;
}

var validatingId = 0;

ValidationBag.newValidatingId = function () {
  return (++validatingId).toString();
};

export default ValidationBag;
