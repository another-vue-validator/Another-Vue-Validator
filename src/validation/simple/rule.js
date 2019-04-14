'use strict';

import defaultTemplates from './templates';

import {
  isEmpty,
  isNaN,
  format,
  isArray,
  isString,
  formatMessage,
  isFunction,
  optionCombiner
}
  from './utils/utils'
import ValidationContext from "../ValidationContext";

function Rule(templates) {
  this._field = '';
  this._ctx = new ValidationContext();
  this._messages = [];

  if (templates) {
    // merge given template and imported template
    this.templates = {};
    Object.keys(templates).forEach(function (key) {
      this.templates[key] = defaultTemplates[key];
    }.bind(this));

    Object.keys(templates).forEach(function (key) {
      this.templates[key] = templates[key];
    }.bind(this));

  } else {
    this.templates = defaultTemplates;
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
}

Rule.prototype.lessThan = function (bound, message) {

  return this.rangeCheck(message, this.templates.lessThan, arguments, (number) => {
    return (number >= bound);
  });
}

Rule.prototype.lessThanOrEqualTo = function (bound, message) {

  return this.rangeCheck(message, this.templates.lessThanOrEqualTo, arguments, (number) => {
    return (number > bound);
  });
}

Rule.prototype.greaterThan = function (bound, message) {

  return this.rangeCheck(message, this.templates.greaterThan, arguments, (number) => {
    return (number <= bound);
  });
}

Rule.prototype.greaterThanOrEqualTo = function (bound, message) {

  return this.rangeCheck(message, this.templates.greaterThanOrEqualTo, arguments, (number) => {
    return (number < bound);
  });
}

Rule.prototype.between = function (lowBound, highBound, message) {

  return this.rangeCheck(message, this.templates.between, arguments, (number) => {
    return (number < lowBound || number > highBound);
  });
};

Rule.prototype.size = function (size, message) {
  let value = this._checkValue();

  if (!isEmpty(value) && isArray(value) && value.length !== size) {
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
}

Rule.prototype.in = function (options, message) {
  return this.inCheck(options, message, "in", this.templates.in, arguments, (value) => {
    return (!isEmpty(value) && options.indexOf(value) < 0);
  });
};
Rule.prototype.notIn = function (options, message) {
  return this.inCheck(options, message, "in", this.templates.notIn, arguments, (value) => {
    return (!isEmpty(value) && options.indexOf(value) >= 0);
  });
}

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

export default Rule;

function argsToArray(message, template, ctx, args) {
  let result = Array.prototype.slice.call(args);
  result.unshift(message, template, ctx);
  return result;
}
