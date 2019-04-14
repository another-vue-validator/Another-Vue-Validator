var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
}

// This implementation of debounce was taken from the blog of David Walsh.
// See here: https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
  var timeout;

  return function () {
    var context = this;
    var args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}
function formatMessage(template, ctx) {
  var args = Array.prototype.slice.call(arguments, 2);
  let prop = ctx.prop ? ctx.prop : 'field';
  prop = prettyLabel(prop.trim());
  args.unshift(template, prop);
  let msg = format.apply(this, args);
  return msg;
}

function format(template) {
  var args = Array.prototype.slice.call(arguments, 1);
  return template.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
}
function isArray$1(arg) {
  return Array.isArray(arg);
}
function isEmpty(value) {
  if (isArray$1(value)) {
    return !value.length;
  } else if (value === undefined || value === null) {
    return true;
  } else {
    return !String(value).trim().length;
  }
}
function isEqual(o1, o2) {
  return equal(o1, o2);
}
function isFunction(arg) {
  return typeof arg === 'function';
}
function isNaN(arg) {
  return /^\s*$/.test(arg) || window.isNaN(arg);
}
function isNull(arg) {
  return arg === null;
}
function isString(arg) {
  return typeof arg === 'string' || arg instanceof String;
}
function isUndefined(arg) {
  return typeof arg === 'undefined';
}
function omit(obj, key) {
  var result = {};

  for (var name in obj) {
    if (name !== key) {
      result[name] = obj[name];
    }
  }

  return result;
}
function fromEntries(arr) {
  let obj = {};
  arr.forEach(item => {
    obj[item] = null;
  });
  return obj;
}

function splitKeypath(keypath) {
  let parts = keypath.split(".");
  return {
    path: keypath,
    parts: parts,
    prop: parts[parts.length - 1]
  }
}

function prettyLabel(str) {
  // insert a space before all caps
  str = str.replace(/([A-Z])/g, ' $1');
  str = str.toLowerCase();
  // uppercase the first character
  str = capitalize(str);
  return str;
}

function capitalize(str) {
  if (typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function optionCombiner(options) {
  if (options.length > 2) {
    options = [options.slice(0, options.length - 1).join(', '), options[options.length - 1]];
  }
  return options.join(' or ');
}

class Flags {

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

class Field {

  constructor(options = {initialValue: null, flags, errors: [], keypath: null}) {

    if (options.keypath == null) {
      throw new Error("keypath must be provided");
    }

    this.errorList = options.errors || [];
    this.keypath = options.keypath;
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
    this.setValue( this.value );
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
  };

  addError(msg) {
    this.flags.setValid(false);
    this.errorList.push(msg);
  };


  firstError() {
    return this.errorList[0];
  };

  errors() {
    return this.errorList;
  };

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
    field.setValidating(false);
  }

  getDependencies() {
    return this.dependencies;
  }

  setDependencies( deps = [] ) {
    this.dependencies = deps;
  }
}

function ValidationBag() {
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
}

ValidationBag.prototype._setVM = function (vm) {
  this._vm = vm;
};

ValidationBag.prototype.addField = function (options) {

  // if (this.resetting) {
  //   throw new Error("Cannot add field while resetting");
  // }

  let field = new Field(options);
  this._vm.$set(this.fields, options.keypath, field);
  //this.fields[options.keypath] = field;
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
    throw new Error("keypath cannot be null");
  }

  let field = this.fields[keypath];
  // if (field == null) {
  //   throw new Error("no validator defined for keypath " + keypath);
  // }
  return field;
};

ValidationBag.prototype.removeErrors = function (keypath) {

  if (keypath == null) {
    this.fields.forEach(field => field.removeErrors());

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
      if (error) return error;
    }
  }

  let field = this.fields[keypath];
  if (field) {
    return field.firstError();
  }
  return null;
};

ValidationBag.prototype.allErrors = function (keypath) {

  if (keypath) {
    return this.fields[keypath].errors();
  } else {
    Object.values().map(field => {
      return field.errors()
    });
  }

};

ValidationBag.prototype.countErrors = function (keypath) {

  if (keypath == null) {
    this.fields.reduce((total, field) => {
      total + field.errors().length;
    });

  } else {
    let field = this.fields[keypath];
    if (field) return field.errors().length;
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
    this.fields.forEach(field => field.resetValidating());
  }
};

ValidationBag.prototype.isValidating = function (keypath, id) {
  let field = this.getField(keypath);
  if (!field) return false;

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
      console.log(key, flag, flags[flag]);
      if (flags[flag]) return true;
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

  if (err && this.activated) return true; // First criteria to show error

  let touched = this.isTouched(keypath);
  let dirty = this.isDirty(keypath);


  //let validated = this.isValidated(keypath);
  //if (err && validated) return true;
  if (err && touched && dirty) return true; // Second criteria to show error
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
    throw new Error(flag + " accepts true/false as argument");
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
//   this.setFlag(keypath, "setValid", false)
// }

ValidationBag.prototype.setValid = function (keypath, val) {
  this.setFlag(keypath, "setValid", val);
};

// ValidationBag.prototype.setPristine = function (keypath, val) {
//   this.setFlag(keypath, "setDirty", val)
// }

ValidationBag.prototype.setDirty = function (keypath, val) {
  this.setFlag(keypath, "setDirty", val);
};

ValidationBag.prototype.setTouched = function (keypath, val) {
  this.setFlag(keypath, "setTouched", val);
};

// ValidationBag.prototype.setUntouched = function (keypath) {
//   this.setFlag(keypath, "setTouched", false)
// }

ValidationBag.prototype.setPending = function (keypath, val) {
  this.setFlag(keypath, "setPending", val);
};

ValidationBag.prototype.setValidated = function (keypath, val) {
  this.setFlag(keypath, "setValidated", val);
};

ValidationBag.prototype.setChanged = function (keypath, val) {
  this.setFlag(keypath, "setChanged", val);
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
  Object.values(this.fields).forEach(field => {
    field.reset();
  });

  // this.validatingRecords = [];
  // this.passedRecords = [];
  // this.touchedRecords = [];
  if (this._vm) {
    // prevent field updates at the same tick to change validation status
    this.resetting++;
    this._vm.$nextTick(function () {
      this.resetting--;
    }.bind(this));
  }
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

  var messages = isArray$1(message) ? message : [message];

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

var templates = {
  error: 'Error.',
  required: '{0} is required.',
  float: '{0} must be a number.',
  integer: '{0} must be an integer.',
  number: '{0} must be a number.',
  lessThan: '{0} must be less than {1}.',
  lessThanOrEqualTo: '{0} must be less than or equal to {1}.',
  greaterThan: '{0} must be greater than {1}.',
  greaterThanOrEqualTo: '{0} must be greater than or equal to {1}.',
  between: '{0} must be between {1} and {2}.',
  size: '{0} size must be {1}.',
  length: '{0} length must be {1}.',
  minLength: '{0} must have at least {1} characters.',
  maxLength: '{0} must have up to {1} characters.',
  lengthBetween: '{0} length must between {1} and {2}.',
  in: '{0} must be either {1}.',
  notIn: '{0} must not be {1}.',
  match: '{0} does not match {2}.',
  regex: '{0} has invalid format.',
  digit: '{0} must only contain numbers.',
  email: '{0} is not a valid email.',
  url: '{0} is not a valid url.'
};

class ValidationContext {

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
  let path = clonedArrayWithoutProp.join(".");
  return path;
}

function Rule(templates$1) {
  this._field = '';
  this._ctx = new ValidationContext();
  this._messages = [];

  if (templates$1) {
    // merge given template and imported template
    this.templates = {};
    Object.keys(templates$1).forEach(function (key) {
      this.templates[key] = templates[key];
    }.bind(this));

    Object.keys(templates$1).forEach(function (key) {
      this.templates[key] = templates$1[key];
    }.bind(this));

  } else {
    this.templates = templates;
  }
}

Rule.prototype.field = function (keypath) {
  this._field = keypath;
  return this;
};

Rule.prototype.prop = function (prop) {
  this._ctx.prop = prop;
  return this;
};

Rule.prototype.context = function (ctx) {

  let newProp = this._ctx.prop.length == 0 ? ctx.prop : this._ctx.prop;

  this._ctx = Object.assign(this._ctx, ctx);
  this._ctx.prop = newProp;
  return this;
};

Rule.prototype.custom = function (callback, context) {
  let message = context ? callback.call(context) : callback();
  if (message) {
    if (message.then) {
      let that = this;
      message = Promise.resolve(message)
        .then(function (result) {
          return result;
        })
        .catch(function (e) {
          //console.error(e.toString());
          return that.templates.error;
        });
    }
    this._messages.push(message);
  }
  return this;
};

Rule.prototype._checkValue = function () {
  // if (this._ctx.value === undefined) {
  //   throw new Error('Validator.value is undefined, make sure it is set (even to null), otherwise Vue cannot track changes of the value');
  // }
  return this._ctx.value;
};

Rule.prototype.required = function (message) {
  let value = this._checkValue();
  if (isEmpty(value)) {
    let args = argsToArray(message, this.templates.required, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.float = function (message) {
  let value = this._checkValue();
  let regex = /^([-+])?([0-9]+(\.[0-9]+)?|Infinity)$/;
  if (!isEmpty(value) && !regex.test(value)) {
    let args = argsToArray(message, this.templates.float, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.integer = function (message) {
  let value = this._checkValue();
  let regex = /^([-+])?([0-9]+|Infinity)$/;

  if (!isEmpty(value) && !regex.test(value)) {
    let args = argsToArray(message, this.templates.integer, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.rangeCheck = function (message, template, origArgs, check) {
  let value = this._checkValue();

  if (!isEmpty(value)) {
    let number = parseFloat(value);

    if (isNaN(number)) {
      let args = argsToArray(message, this.templates.number, this._ctx, origArgs);
      this.addMessage.apply(this, args);

    } else if (check(number)) {
      let args = argsToArray(message, template, this._ctx, origArgs);
      this.addMessage.apply(this, args);
    }
  }
  return this;
};

Rule.prototype.lessThan = function (bound, message) {

  return this.rangeCheck(message, this.templates.lessThan, arguments, (number) => {
    return (number >= bound);
  });
};

Rule.prototype.lessThanOrEqualTo = function (bound, message) {

  return this.rangeCheck(message, this.templates.lessThanOrEqualTo, arguments, (number) => {
    return (number > bound);
  });
};

Rule.prototype.greaterThan = function (bound, message) {

  return this.rangeCheck(message, this.templates.greaterThan, arguments, (number) => {
    return (number <= bound);
  });
};

Rule.prototype.greaterThanOrEqualTo = function (bound, message) {

  return this.rangeCheck(message, this.templates.greaterThanOrEqualTo, arguments, (number) => {
    return (number < bound);
  });
};

Rule.prototype.between = function (lowBound, highBound, message) {

  return this.rangeCheck(message, this.templates.between, arguments, (number) => {
    return (number < lowBound || number > highBound);
  });
};

Rule.prototype.size = function (size, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && isArray$1(value) && value.length !== size) {
    let args = argsToArray(message, this.templates.size, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.length = function (length, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && String(value).length !== length) {
    let args = argsToArray(message, this.templates.length, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.minLength = function (length, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && String(value).length < length) {
    let args = argsToArray(message, this.templates.minLength, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.maxLength = function (length, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && String(value).length > length) {
    let args = argsToArray(message, this.templates.maxLength, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.lengthBetween = function (minLength, maxLength, message) {
  let value = this._checkValue();

  if (!isEmpty(value)) {
    let string = String(value);

    if (string.length < minLength || string.length > maxLength) {
      let args = argsToArray(message, this.templates.lengthBetween, this._ctx, arguments);
      this.addMessage.apply(this, args);
    }
  }
  return this;
};

Rule.prototype.inCheck = function (options, message, name, template, origArgs, check) {
  let value = this._checkValue();

  if (!Array.isArray(options)) {
    throw new Error("validator." + name + "() requires an array of options");
  }

  let chk = check(value);
  if (chk) {
    options = optionCombiner(options);
    let args = Array.prototype.slice.call(origArgs, 2);
    let result = [message, template, this._ctx, options].concat(args);
    this.addMessage.apply(this, result);
  }
  return this;
};

Rule.prototype.in = function (options, message) {
  return this.inCheck(options, message, "in", this.templates.in, arguments, (value) => {
    return (!isEmpty(value) && options.indexOf(value) < 0);
  });
};
Rule.prototype.notIn = function (options, message) {
  return this.inCheck(options, message, "in", this.templates.notIn, arguments, (value) => {
    return (!isEmpty(value) && options.indexOf(value) >= 0);
  });
};

Rule.prototype.match = function (valueToCompare, label, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && value !== valueToCompare) {
    let args = argsToArray(message, this.templates.match, this._ctx, arguments);
    this.addMessage.apply(this, args);
  }
  return this;
};

Rule.prototype.regex = function (regex, message, template) {
  let value = this._checkValue();

  if (!isEmpty(value)) {

    if (isString(regex)) {
      regex = new RegExp(regex);
    }

    if (!regex.test(value)) {
      template = template || this.templates.regex;
      let args = argsToArray(message, template, this._ctx, arguments);
      this.addMessage.apply(this, args);
    }
  }
  return this;
};

Rule.prototype.digit = function (message) {
  return this.regex(/^\d*$/, message, this.templates.digit);
};

Rule.prototype.email = function (message) {
  return this.regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, message, this.templates.email);
};

Rule.prototype.url = function (message) {
  return this.regex(/(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/, message, this.templates.url);
};

Rule.prototype.hasImmediateError = function () {
  for (let i = 0; i < this._messages.length; i++) {
    if (this._messages[i] && !this._messages[i].then) {
      return true;
    }
  }
  return false;
};

Rule.prototype.addMessage = function (message, template, ctx) {

  if (message) {
    this._messages.push(message);
    return;
  }

  // Turn arguments into a proper array remove message and template but keep ctx as first argument in array
  let args = Array.prototype.slice.call(arguments, 2);

  if (isFunction(template)) {
    message = template.apply(this, args);

  } else {
    args.unshift(template);
    message = this.formatTemplate.apply(this, args);
  }

  this._messages.push(message);
};

Rule.prototype.formatTemplate = function (template, ctx) {
  let msg = formatMessage.apply(this, arguments);
  return msg;
};

function argsToArray(message, template, ctx, args) {
  let result = Array.prototype.slice.call(args);
  result.unshift(message, template, ctx);
  return result;
}

let Validator = newValidator();

Validator.create = function (options) {
  return newValidator(options);
};

function newValidator(options) {
  options = options || {};
  let validator = {};

  // clone methods from Rule to validator
  Object.keys(Rule.prototype).forEach(function (methodName) {
    validator[methodName] = function () {
      let rule = new Rule(options.templates);
      return rule[methodName].apply(rule, arguments);
    };
  });

  validator.isEmpty = isEmpty;

  validator.format = format;

  return validator;
}

var mixinUtils = {

  /**
   * 'communicator.name': {
   *
   *     validator: function() {},
   *
   *     deps: {
   *      contactRequired: {
   *      keypaths: ['communicator.other', 'communicator.radio'],
   *      show: function() {} or flags['dirty', 'xxx'] ???
   *      },
   *      other: {
   *      keypaths: ['communicator.foo', 'communicator.bar']
   *      }
   *   }
   *
   * }
   */
  setupDependencies(vm) {

    let avv = vm.$options.avv;
    let deps = avv.deps;

    if (deps) {
      Object.keys(deps).forEach(key => {
        let dep = deps[key];
        if (dep) {
          this.addDependency(vm, dep);
        }
      });
    }
  },

  addDependency(vm, dep) {
    let depsArray = dep.keypaths;
    if (!depsArray) {
      return;
    }

    //let depsObj = utils.fromEntries(depsArray);

    depsArray.forEach(keypathToWatch => {

      // any change to one dependency will fire the validators of the other dependents

      // omit the watched dependency from the dependency list (we don't want a dependency to call itself)
      let others = depsArray.filter(dep => dep !== keypathToWatch);
      //let others = utils.omit(depsObj, keypathToWatch);

      let depMethod = () => {
        return vm.$validate(others);
      };

      let depToWatch = depMethod;

      if (dep.debounce) {
        depToWatch = this.debounce.bind(vm)(keypathToWatch, dep.debounce, depMethod);
      }
      let unwatch = vm.$watch(keypathToWatch, depToWatch);

      //TODO Ensure unwatch works
      vm.$options.validatorsUnwatchCallbacks.push(unwatch);
    });
  },

  debounce(keypath, debounce$1, validateMethod) {
    // TODO what if custom field name is used?
    let decoratedValidateMethod = function () {

      if (decoratedValidateMethod.sessionId !== this.validation.sessionId) {
        // skip validation if it's reset before
        return Promise.resolve(false);
      }

      return validateMethod.apply(this, arguments);
    }.bind(this);

    let debouncedValidateMethod = debounce(decoratedValidateMethod, parseInt(debounce$1));

    let validateMethodForWatch = function () {
      // eagerly resetting passed flag if debouncing is used.
      //this.validation.resetPassed(keypath);
      this.validation.setValid(keypath, false);
      // store sessionId
      decoratedValidateMethod.sessionId = this.validation.sessionId;
      debouncedValidateMethod.apply(this, arguments);
    }.bind(this);

    return validateMethodForWatch;
  },

  cache(validator, option) {
    return function () {
      let cache = validator.cache;

      if (!cache) {
        cache = [];
        validator.cache = cache;
      }

      let args = Array.prototype.slice.call(arguments);
      let cachedResult = findInCache(cache, args);

      if (!isUndefined(cachedResult)) {
        return cachedResult;
      }

      let result = validator.apply(this, args);

      if (!isUndefined(result)) {

        if (result.then) {

          return result.then(function (promiseResult) {
            if (!isUndefined(promiseResult)) {
              if (option !== 'all') {
                cache.splice(0, cache.length);
              }
              cache.push({args: args, result: promiseResult});
            }
          });

        } else {

          if (option !== 'all') {
            cache.splice(0, cache.length);
          }
          cache.push({args: args, result: result});
          return result;
        }
      }
    }
  },

  findInCache(cache, args) {
    let items = cache.filter(function (item) {
      return isEqual(args, item.eventData);
    });

    if (!isEmpty(items)) {
      return items[0].result;
    }
  }
};

var modes = {
  INTERACTIVE: 'INTERACTIVE',
  MANUAL: 'MANUAL',
  CONSERVATIVE: 'CONSERVATIVE'
};

var avvConfig = {
  mode: modes.INTERACTIVE, // other values: conservative and manual

  getMode() {
    return this.mode;
  },

  setMode(val) {
    if (modes[val] == null) {
      throw new Error('Invalid mode: ' + val);
    }
    this.mode = val;
  }
};

let mixin = {

  Promise: null,

  beforeMount: function () {

    this.$validation = this.validation;

    if (this.validation) {
      // set vm to validation
      this.validation._setVM(this);
    }

    this.$setValidators(this.$options.avv);

  },

  beforeDestroy: function () {
    unwatch(this.$options.validatorsUnwatchCallbacks);
  },

  data: function () {
    let avv = this.$options.avv;
    if (avv && avv.validators) {
      return {
        validation: new ValidationBag()
      };
    }
    return {};
  },

  methods: {
    $setValidators: function (avv) {

      unwatch(this.$options.validatorsUnwatchCallbacks);

      // validate methods contains all application validate codes
      let validateMethods = {};
      this.$options.validateMethods = validateMethods;

      let unwatchCallbacks = [];
      this.$options.validatorsUnwatchCallbacks = unwatchCallbacks;

      // generate validate methods and watch properties change for validators
      if (avv && avv.validators) {
        Object.keys(avv.validators).forEach(function (key) {
          let validator = avv.validators[key];
          this.$addValidator(key, validator);
        }, this);

        mixinUtils.setupDependencies(this);
      }
    },

    $addValidator(keypath, validator) {
      let getter = generateGetter(this, keypath);

      this.validation.addField({
        keypath,
        initialValue: getter(),
      });

      let options = {};

      if (!isFunction(validator)) {
        options = omit(validator, 'validator');
        validator = validator.validator;
      }

      if (options.cache) {
        // cache the validation result, so that async validator can be fast when submitting the form
        let option = options.cache === 'last' ? 'last' : 'all';
        validator = mixinUtils.cache(validator, option);
      }

      let validateMethod = createValidateMethod(validator, keypath, getter).bind(this);

      // add to validate method list
      this.$options.validateMethods[keypath] = validateMethod;

      // watch change and invoke validate method
      let validateMethodForWatch = validateMethod;

      if (options.debounce) {
        validateMethodForWatch = mixinUtils.debounce.bind(this)(keypath, options.debounce, validateMethod);
      }

      if (avvConfig.getMode() !== modes.MANUAL) { // have to call $validate() to trigger validation in manual mode, so don't watch,
        let unwatch = watchProperty(this, keypath, validateMethodForWatch); //.forEach(function (unwatch) {
        this.$options.validatorsUnwatchCallbacks.push(unwatch);
        //}.bind(this));
      }
    },

    $addDependency(deps) {
      mixinUtils.addDependency(this, deps);
    },

    $getValidator(key) {
      let avv = this.$options.avv;
      if (avv && avv.validators) {
        return avv.validators[key];
      }
    },

    $validate: function (keypaths) {

      // We're still busy with a previous validation eg async validation that it haven't resolved yet
      if (this.validation._validatePromise) {
        return this.validation._validatePromise;
      }

      let validateMethods = this.$options.validateMethods;

      if (isUndefined(keypaths)) {
        this.validation.activated = true;

        validateMethods = Object.keys(validateMethods).map(function (keypath) {
          return validateMethods[keypath];
        });

      } else {
        keypaths = isArray$1(keypaths) ? keypaths : [keypaths];

        // Only use validate methods with matching keypaths
        validateMethods = keypaths
          .filter(keypath => validateMethods[keypath] != null)
          .map(keypath => validateMethods[keypath]);

        //throw new Error("No validator is specified for the keypath: " + keypath );
      }

      if (isEmpty(validateMethods)) {
        return Promise.resolve(true);

      } else {
        let always = function () {
          this.validation._validatePromise = null;
        }.bind(this);

        let validatingMethods = validateMethods.map(function (validateMethod) {
          let result = validateMethod();
          return result;
        });

        this.validation._validatePromise = Promise.all(validatingMethods).then(function (results) {
          always();

          let filtered = results.filter(result => !!result);
          let result = filtered.length <= 0;
          return result;

        }.bind(this))

          .catch(function (e) {
            always();
            throw e;
          });

        return this.validation._validatePromise;
      }
    }
  }
};

function unwatch(list) {
  if (list) {
    list.forEach(function (unwatch) {
      unwatch();
    });
  }
}

function generateGetter(vm, property) {
  let names = property.split('.');
  return function () {
    let value = vm;

    for (let i = 0; i < names.length; i++) {
      if (isNull(value) || isUndefined(value)) {
        break;
      }
      value = value[names[i]];
    }
    return value;
  };
}

function watchProperty(vm, keypath, callback) {
  return vm.$watch(keypath, function (newValue, oldValue) {
    let field = vm.validation.getField(keypath);
    if (field) {
      // Update the field value
      field.setValue(newValue);
    }

    callback.call();
  });
  //});
}

function createValidateMethod(validator, keypath, getter) {

  let contextOptions = splitKeypath(keypath);
  let ctx = new ValidationContext(contextOptions);

  return function () {
    if (avvConfig.getMode() === modes.CONSERVATIVE && !this.validation.activated) { // do nothing if in conservative mode and $validate() method is not called before
      return Promise.resolve(false);
    }

    // let args = getters.map(function (getter) {
    //   return getter();
    // });

    ctx.value = getter();

      let rule = validator.apply(this, [ctx]);
    if (rule) {

      if (!rule._field) {
        // field defaults to the first property
        rule.field(keypath);
      }

      // Promise resolve with value hasError -> true or false
      let promise = this.validation.checkRule(rule);
      return promise;

    } else {
      this.validation.setError(keypath);
      return Promise.resolve(false);
    }
  }
}

let utils = {

  remove(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
      array.splice(index, 1);
    }
  }
};

class EventManager {

  constructor() {
    this.eventData = new Map();
  }

  addEventListeners(el, events, fn, options) {

    events.forEach(event => {
      el.addEventListener(event, fn, options);

      let dataArray = this.eventData.get(el);
      if (dataArray == null) {
        dataArray = dataArray || [];
        this.eventData.set(el, dataArray);
      }

      dataArray.push({
        el: el,
        event: event,
        listener: fn
      });
    });
  }

  removeEventListeners(el, events) {
    console.log("before remove", this.eventData.size);

    //let subList = this.eventData.filter(data => data.el === el);
    // Clone the array so we can remove items below without effecting the loop
    let dataArray = this.eventData.get(el);
    dataArray = dataArray ? dataArray.slice(0) : [];

    dataArray.forEach(data => {
      this._removeEventListener(data, events);
    });
  }

  _removeEventListener(data, events) {
    if (events) {
      // Only remove listener if contained in given events args
      if (events.includes(data.event)) {
        this._removeListenerAndData(data);
      }

    } else {
      // Always remove listener
      this._removeListenerAndData(data);
    }

    console.log("after remove", this.eventData.size);
  }

  _removeListenerAndData(data) {
    data.el.removeEventListener(data.event, data.listener);
    let dataArray = this.eventData.get(data.el);
    utils.remove(dataArray, data);
    if (dataArray.length == 0) {
      this.eventData.delete(data.el);
    }
  }

  getTouchEventNames(el) {

    let name = el.nodeName.toLowerCase();
    if (name === 'input' ||
      name === 'textarea' ||
      name === 'select' ||
      name === 'checkbox' ||
      name === 'radio' ||
      name === 'datalist') {

      return ['blur', 'change'];
    }
    return [];
  }

  findVModelExpr(vnode, binding) {

    if (vnode == null) {
      return null;
    }

    let expr = null;

    if (binding) {
      expr = binding.value ? binding.value.expr : binding.expression;
    }

    if (expr) return expr;

    if (vnode.data.model) {
      return vnode.data.model.expression;
    }

    if (vnode.data.directives) {
      let model = vnode.data.directives.find(function (directive) { //Search the vModelName attached to the element
        return directive.name === 'model';
      });

      if (model) return model.expression;
    }

    return null;
  }
}

let depsByKeypath;

var dependencyService = {

  _addDependencies(vm) {

    if (depsByKeypath) {
      return depsByKeypath;
    }

    depsByKeypath = {};
    let deps;
    let avv = vm.$options.avv;
    if (avv && avv.deps) {
      deps = avv.deps;
    }

    if (deps) {
      Object.keys(deps).forEach(key => {
        let dep = deps[key];
        if (dep) {
          this.addDependency(dep);
        }
      });
    }

    return depsByKeypath;

    // Finally we have this structure
    /*
     depsByKeypath -> {
     'person.foo': {
        'person.bar': null, 'person.moo': null
      },
      person.bar': {
        'person.foo': null, 'person.moo': null
      },
      person.moo': {
        'person.foo': null, 'person.bar': null
      }
     }
      */
  },

  addDependency(dep) {
    // ['person.foo', 'person.bar', person.moo']
    let depsArray = dep.keypaths;

    // depsObj -> { 'person.foo': null, 'person.bar': null, 'person.moo': null }
    let depsObj = fromEntries(depsArray);

    Object.keys(depsObj).forEach(keypath => {
      let currKeypathDeps = depsByKeypath[keypath];
      if (!currKeypathDeps) {
        currKeypathDeps = depsByKeypath[keypath] = {};
      }

      // keypath -> 'person.foo'
      // keypathDeps -> { 'person.bar': null, 'person.moo': null }
      let newKeypathDeps = omit(depsObj, keypath);

      // Copy newKeypathDeps onto current keypathDeps
      Object.assign(currKeypathDeps, newKeypathDeps);

      // We end up with this structure
      // depsByKeypath -> { 'person.foo': { 'person.bar': null, 'person.moo': null }}
    });
  },
};

let eventManager = new EventManager();

var ValidateDirective = {

  inserted(el, binding, vnode) {

    let vm = vnode.context;

    if (vm.validation == null) {
      throw new Error("Validator hasn't been setup for this view.")
    }

    el = resolveEl(el, binding);


    let eventNames = eventManager.getTouchEventNames(el);

    // setTimeout(function() {
    //   console.log("BEFORE", eventManager.eventData.size)
    //   eventManager.removeEventListeners(el, eventNames);
    //   console.log("AFTER", eventManager.eventData.size)
    // }, 5000)

    let expr = eventManager.findVModelExpr(vnode, binding);

    //console.log("v-model expression", expr ? expr : "could not find v-model expression on element " + el.tagName);
    if (expr == null) {
      throw new Error("you must specify the path to your model -> v-validate('person.name')");
    }

    setupDependencies(expr, vm);

    if (showOnError(binding)) {
      vm.validation.setTouched(expr, true);
      // TODO What else should we flag to ensure error is always shown?
      return;
    }

    eventManager.addEventListeners(el, eventNames, getTouchListener(el, vm, expr), {once: true});
  },

  unbind(el, binding, vnode) {

    el = resolveEl(el, binding);

    let eventNames = eventManager.getTouchEventNames(el);
    eventManager.removeEventListeners(el, eventNames);
  }
};

function setupDependencies(keypath, vm) {
  let field = vm.validation.getField(keypath);
  if (field) {
    let deps = dependencyService._addDependencies(vm);
    field.setDependencies(deps[keypath]);
  }
}

function resolveEl(el, binding) {
  if (binding.value && binding.value.el) {
    let selector = binding.value.el;
    let newEl = document.querySelector(selector);
    if (newEl) {
      el = newEl;
    } else {
      console.error('no element found for v-validate.el: ' + selector);
    }
  }
  return el;
}

function showOnError(binding) {
  if (binding.value && binding.value.showOnError) {
    return true;
  }
  return false;
}

function getTouchListener(el, vm, keypath) {

  let touchListener = function (evt) {

    let eventNames = eventManager.getTouchEventNames(el);
    if (eventNames.includes(evt.type.toLowerCase())) {

      vm.validation.setTouched(keypath, true);

      let field = vm.validation.getField(keypath);
      if (field) {
        let deps = field.getDependencies();
        Object.keys(deps).forEach(dep => {
          vm.validation.forceShow(dep);
        });
      } else {
        console.warn("no validation field found for v-model/expr: '" + keypath + "'. Use v-validate=\"{expr: 'some.keypath'}\" to specify a valid keypath");
      }

      eventManager.removeEventListeners(el, eventNames);

    }

    console.log(evt.type);
  };

  return touchListener;
}

let plugin = {

  /* plugin install
   ----------------------------------- */

  install(Vue, options) {
    Vue.mixin(mixin);

    Vue.directive('validate', ValidateDirective);

    if (options) {
      if (options.templates) {
        extendTemplates(options.templates);
      }
      if (options.mode) {
        avvConfig.setMode(options.mode);
      }
      if (options.Promise) {
        mixin.Promise = options.Promise;
      }
    }
  },

  extendTemplates(newTemplates) {
    Object.keys(newTemplates).forEach(function (key) {
      templates[key] = newTemplates[key];
    });
  }
};


/* exports
 ----------------------------------- */

let extendTemplates = plugin.extendTemplates;

// module.exports.name = 'SimpleVueValidator';
// module.exports.ValidationBag = ValidationBag;
// module.exports.Rule = Rule;
// module.exports.Validator = Validator;
// module.exports.mixin = mixin;
// module.exports.install = install;
// module.exports.extendTemplates = extendTemplates;
// module.exports.setMode = setMode;

export default plugin;
export { Rule, ValidationBag, Validator, extendTemplates };
