'use strict';

import deepEqual from './deep-equal';

// This implementation of debounce was taken from the blog of David Walsh.
// See here: https://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate) {
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
};

export function formatMessage(template, ctx) {
  var args = Array.prototype.slice.call(arguments, 2);
  let prop = ctx.prop ? ctx.prop : 'field';
  prop = prettyLabel(prop.trim());
  args.unshift(template, prop);
  let msg = format.apply(this, args);
  return msg;
}

export function format(template) {
  var args = Array.prototype.slice.call(arguments, 1);
  return template.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

export function isArray(arg) {
  return Array.isArray(arg);
};

export function isEmpty(value) {
  if (isArray(value)) {
    return !value.length;
  } else if (value === undefined || value === null) {
    return true;
  } else {
    return !String(value).trim().length;
  }
};

export function isEqual(o1, o2) {
  return deepEqual(o1, o2);
};

export function isFunction(arg) {
  return typeof arg === 'function';
};

export function isNaN(arg) {
  return /^\s*$/.test(arg) || window.isNaN(arg);
};

export function isNull(arg) {
  return arg === null;
};

export function isString(arg) {
  return typeof arg === 'string' || arg instanceof String;
};

export function isUndefined(arg) {
  return typeof arg === 'undefined';
};

export function omit(obj, key) {
  var result = {};

  for (var name in obj) {
    if (name !== key) {
      result[name] = obj[name];
    }
  }

  return result;
};

export function fromEntries(arr) {
  let obj = {};
  arr.forEach(item => {
    obj[item] = null;
  })
  return obj;
}

export function splitKeypath(keypath) {
  let parts = keypath.split(".");
  return {
    path: keypath,
    parts: parts,
    prop: parts[parts.length - 1]
  }
}

export function prettyLabel(str) {
  // insert a space before all caps
  str = str.replace(/([A-Z])/g, ' $1');
  str = str.toLowerCase();
  // uppercase the first character
  str = capitalize(str);
  return str;
}

export function capitalize(str) {
  if (typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function optionCombiner(options) {
  if (options.length > 2) {
    options = [options.slice(0, options.length - 1).join(', '), options[options.length - 1]];
  }
  return options.join(' or ');
}
