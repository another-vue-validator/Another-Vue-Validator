'use strict';
import mixinUtils from '../utils/mixin-utils';
import * as utils from '../utils/utils';
import ValidationBag from './validation-bag';
import ValidationContext from './ValidationContext';
import avvConfig from './config/avvConfig';
import modes from './config/modes';

let mixin = {

  Promise: null,

  beforeMount: function () {

    this.$avvInit();

    if (this.validation) {
      // TODO we set VM here instead of in data(){} because Vue does sync' with component data and it causes infinite loops?
      this.validation._setVM(this);
    }
    //this.$addValidators(this.$options.avv);
  },

  mounted: function () {
    this.$addValidators(this.$options.avv);
    // TODO add validators here or beforeMount? If added in beforeMount, data set component inside beforeMount will be
    // validated when set, and thus in an invalid state immediately. Setting validators in mounted, means data set
    // during beforeMount won't be validated since the validators haven't been set yet. However data in components
    // should be set in the data(){} function anyway. However adding validators in mounted, means no validators
    // are available once the view renders AND what if you *WANT* the validators to fire on the data.... in the case
    // probably better to call $validate manually
  },

  beforeDestroy: function () {
    unwatch(this.$options.validatorsUnwatchCallbacks);
  },

  data() {
    let avv = this.$options.avv;
    if (avv == null) {
      avv = this.$options.avv = {};
    }
    avv.mode = avv.mode || avvConfig.getMode();

    avv.validators = avv.validators || {};

    let validation = new ValidationBag();
    //validation._setVM(this);

    return {
      validation
    };
  },

  methods: {
    $avvInit: function () {
      unwatch(this.$options.validatorsUnwatchCallbacks);

      // validate methods contains all application validate codes
      this.$options.validateMethods = {};

      this.$options.validatorsUnwatchCallbacks = [];
    },

    $setValidators: function (avv) {
      this.$avvInit();
      this.$addValidators(avv);
    },

    $addValidators: function (avv) {
      // generate validate methods and watch properties change for validators
      if (avv && avv.validators) {
        Object.keys(avv.validators).forEach(function (key) {
          let validator = avv.validators[key];
          this.$addValidator(key, validator);
        }, this);

        if (this.$options.avv.mode == modes.MANUAL && avv.deps) {
          console.warn('Mode is set to \'' + modes.MANUAL + '\', yet deps have been set which fires validations when model changes');
        }

        mixinUtils.setupDependencies(this);
      }
    },

    $getValidatorMethod(keypath) {
      return this.$options.validateMethods[keypath];
    },

    $addValidator(keypath, validator) {
      let getter = generateGetter(this, keypath);

      let contextOptions = utils.splitKeypath(keypath);
      let ctx = new ValidationContext(contextOptions);

      if (this.validation) {
        this.validation.addField({
          validationContext: ctx,
          initialValue: getter(),
        });
      }

      let options = {};

      if (!utils.isFunction(validator)) {
        options = utils.omit(validator, 'validator');
        validator = validator.validator;
      }

      options.mode = options.mode || this.$options.avv.mode;

      if (options.cache) {
        // cache the validation result, so that async validator can be fast when submitting the form
        let option = options.cache === 'last' ? 'last' : 'all';
        validator = mixinUtils.cache(validator, option);
      }

      let validateMethod = createValidateMethod(validator, keypath, ctx, getter, options).bind(this);
      validateMethod.origFn = validator;

      // add to validate method list
      this.$options.validateMethods[keypath] = validateMethod;

      // watch change and invoke validate method
      let validateMethodForWatch = validateMethod;

      if (options.debounce) {
        validateMethodForWatch = mixinUtils.debounce.bind(this)(keypath, options.debounce, validateMethod);
      }

      if (options.mode !== modes.MANUAL) { // have to call $validate() to trigger validation in manual mode, so don't watch,
        let unwatch = watchProperty(this, keypath, validateMethodForWatch); //.forEach(function (unwatch) {
        this.$options.validatorsUnwatchCallbacks.push(unwatch);
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

    $validate: function (keypaths, options) {

      // We're still busy with a previous validation eg async validation that it haven't resolved yet
      // if (this.validation._validatePromise) {
      //   return this.validation._validatePromise;
      // }

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
        let valid = true;
        return Promise.resolve(valid);

      } else {
        let always = function () {
          this.validation._validatePromise = null;
        }.bind(this);

        let validatingMethods = validateMethods.map(function (validateMethod) {
          let result = validateMethod( options );
          return result;
        });

        this.validation._validatePromise = Promise.all(validatingMethods).then(function (results) {
          always();

          let aborted = false;
          let filtered = results.filter(result => {

            if ( result.aborted) {
              aborted = true;
              return;

            } else {
              return !!result;
            }
          });

          // TODO if one of the validations in our chain is async and it is overridden and surpassed by a second async request, we
          // return to caller neither valid or invalid, but rather undefined. That way the client knows that an async validation
          // was cancelled by a second async validation and should wait until the second async validation result is returned.
          if (aborted) {
            return undefined;
          }

          let valid = filtered.length <= 0;
          return valid;

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

function createValidateMethod(validator, keypath, ctxTemplate, getter, options) {

  let wrapper = function ( validationOptions = {}) {
    if (options.mode === modes.CONSERVATIVE && !this.validation.activated) { // do nothing if in conservative mode and $validate() method is not called before
      return Promise.resolve(false);
    }

    // validation options (those passed through $validate() ) are copied onto the ctx object and passed to the individual validation methods
    let ctx = Object.assign({}, ctxTemplate, validationOptions );

    Object.defineProperty(ctx, "value", {
      value: getter(),
      configurable: false,
        writable: false
    });

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
      // Clear errors by setting error without a message
      this.validation.setError(keypath);
      return Promise.resolve(false);
    }
  };
  return wrapper;
}

export default mixin;
