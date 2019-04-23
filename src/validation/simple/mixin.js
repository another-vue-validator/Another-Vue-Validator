'use strict';
import mixinUtils from './utils/mixin-utils';
import * as utils from './utils/utils';
import ValidationBag from './validation-bag';
import ValidationContext from '../ValidationContext';
import avvConfig from '../config/avvConfig';
import modes from '../config/modes';

let mixin = {

  Promise: null,

  beforeMount: function () {

    if (this.validation) {
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
        validation: new ValidationBag( { vm: this } )
      };
    }
    return {};
  },

  methods: {
    $setValidators: function (avv) {

      unwatch(this.$options.validatorsUnwatchCallbacks);

      // validate methods contains all application validate codes
      this.$options.validateMethods = {};

      this.$options.validatorsUnwatchCallbacks = [];

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

      if (!utils.isFunction(validator)) {
        options = utils.omit(validator, 'validator');
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

      if (utils.isUndefined(keypaths)) {
        this.validation.activated = true;

        validateMethods = Object.keys(validateMethods).map(function (keypath) {
          return validateMethods[keypath];
        });

      } else {
        keypaths = utils.isArray(keypaths) ? keypaths : [keypaths];

        // Only use validate methods with matching keypaths
        validateMethods = keypaths
          .filter(keypath => validateMethods[keypath] != null)
          .map(keypath => validateMethods[keypath]);

        //throw new Error("No validator is specified for the keypath: " + keypath );
      }

      if (utils.isEmpty(validateMethods)) {
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
      if (utils.isNull(value) || utils.isUndefined(value)) {
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

  let contextOptions = utils.splitKeypath(keypath);
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
  };
}

export default mixin;
