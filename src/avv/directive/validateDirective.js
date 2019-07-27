'use strict';

import EventManager from './EventManager';
import dependencyService from './dependencyService';
import {Validator} from '../index';

let eventManager = new EventManager();

export default {

  // NOTE: Don't use bind(), it fires *before* the DOM is inserted, thus one cannot use  the v-validate: {el: '#myElem"} property to
  // specify the selector for the element, because the element isn't in the DOM yet
  inserted(el, binding, vnode) {

    let vm = vnode.context;

    if (vm.validation == null) {
      throw new Error('Validator hasn\'t been setup for this view.');
    }

    el = resolveEl(el, binding);


    let eventNames = EventManager.getTouchEventNames(el);

    // setTimeout(function() {
    //   console.log('BEFORE', eventManager.eventData.size)
    //   eventManager.removeEventListeners(el, eventNames);
    //   console.log('AFTER', eventManager.eventData.size)
    // }, 5000)

    let expr = EventManager.findVModelExpr(vnode, binding);

    //console.log('v-model expression', expr ? expr : 'could not find v-model expression on element ' + el.tagName);
    if (expr == null) {
      throw new Error('you must specify the path to your model -> v-validate("person.name")');
    }

    let proxy = vm.$getValidatorMethod(expr);
    if (proxy == null) {

      let ruleDefinitions = getRuleDefinitions(binding);
      if (ruleDefinitions != null) {

        // proxy = function () {
        //   return proxy.validationExecutor.apply(this, arguments);
        // };

        let validationExecutor = buildValidationExecutor(ruleDefinitions);
        //proxy.validationExecutor = validationExecutor;

        //vm.$addValidator(expr, proxy);
        vm.$addValidator(expr, validationExecutor);
        //return;
      }
    } else {
      console.warn('There is already a programmatic validator set for "' + expr + '". Ignoring the declarative validator.');
    }

    setupDependencies(expr, vm);

    if (showOnError(binding)) {
      vm.validation.setTouched(expr, true);
      // TODO What else should we flag to ensure error is always shown?
      return;
    }

    eventManager.addEventListeners(el, eventNames, getTouchListener(el, vm, expr));
  },

  update(el, binding, vnode) {
    //console.log("directive update newValue", binding.value);
    // console.log("directive update oldValue", binding.oldValue);
    // console.log("directive update same?", binding.oldValue == binding.value);

    // We don't currently support dynamic declarative validations eg. you cannot conditionally set a required validation
    // based on some property that can change at runtime.

    // However the code below shows how to re-declare the validation if the v-validate args change. Note that the
    // update function is invoked every time the validation runs eg on each keypress so could be expensive operation.


    // let vm = vnode.context;
    //
    // let expr = EventManager.findVModelExpr(vnode, binding);
    //
    // let proxy = getProxy( vm, expr );
    // if (proxy != null) {
    //   let ruleDefinitions = getRuleDefinitions(binding);
    //   if (ruleDefinitions != null) {
    //     let ruleExecutor = buildValidationExecutor(ruleDefinitions);
    //     proxy.validationExecutor = ruleExecutor;
    //   }
    // }
  },

  unbind(el, binding, vnode) {
    el = resolveEl(el, binding);

    let eventNames = EventManager.getTouchEventNames(el);
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

function getRuleDefinitions(binding) {

  if (binding.value && binding.value && binding.value.rules) {
    let definitions = [];

    let ruleArray = binding.value.rules;
    ruleArray = Array.isArray(ruleArray) ? ruleArray : [ruleArray];


    ruleArray.forEach(rule => {
      let definition = getRuleDefinition(rule);
      definitions.push(definition);
    });

    return definitions;
  }
}

function getRuleDefinition(value) {
  if (typeof value === 'object') {
    value = prepareRuleFromObject(value);
    return value;
  }

  let result = parseRuleDefinition(value);
  return result;
}

function prepareRuleFromObject(value) {
  value.args = value.args || [];
  if (value.msg) {
    value.args.push(value.msg);
  }
  return value;
}

function parseRuleDefinition(value) {
  let definition = splitNameAndArgs(value);
  if (definition.args != null) {

    // Parse individual args from the value, separated by comma
    // treat single quotes (') as String messages, so commas inside quotes must not split into separate args.
    let args = definition.args.match(/('.*?'|[^',]+)(?=\s*,|\s*$)/g);
    let i = args.length - 1;
    args[i] = stripQuotes(args[i]);

    definition.args = args;
  }
  return definition;
}

function stripQuotes(msg) {
  if (msg.length > 2) {
    if (msg.charAt(0) === "'" && msg.charAt(msg.length - 1) === "'") {
      msg = msg.slice(1, -1);
    }
    return msg;
  }
}

function splitNameAndArgs(str) {
  let result = {};
  let delimiter = ':';
  if (str.indexOf(':') > 0) {
    result.name = str.substring(0, str.indexOf(delimiter));
    result.args = str.substring(str.indexOf(delimiter) + 1);
  } else {
    result.name = str;
  }

  return result;
}

function buildValidationExecutor(ruleDefinitionsArray) {
  let validators = [
    (ctx) => {
      return Validator.context(ctx);
    }
  ]

  ruleDefinitionsArray.forEach(definition => {

    let validator = function () {
      if (definition.active === false) {
        return this;
      }

      if (this[definition.name]) {

        let result = this[definition.name].apply(this, definition.args);
        return result;
      } else {
        console.error('no rule called "' + definition.name + '" defined');
      }

      return this;
    };

    validators.push(validator);
  });

  let result = null;

  let validationExecutor = function () {

    for (let i = 0; i < validators.length; i++) {
      let validator = validators[i];
      result = validator.apply(result, arguments);
    }
    return result;
  }
  return validationExecutor;
}

function getTouchListener(el, vm, keypath) {

  let touchListener = function (evt) {
    let eventNames = EventManager.getTouchEventNames(el);
    if (eventNames.includes(evt.type.toLowerCase())) {

      let field = vm.validation.getField(keypath);

      if (field) {
        if (field.getFlags().pristine) {
          return;
        }

        vm.validation.setTouched(keypath, true);

        let deps = field.getDependencies();
        Object.keys(deps).forEach(dep => {
          vm.validation.forceShow(dep);
        });
      } else {
        console.warn('no validation field found for v-model/expr: "' + keypath + '". Use v-validate="{expr: \'some.keypath\'}" to specify a valid keypath');
      }

      eventManager.removeEventListeners(el, eventNames);

    }
  };

  return touchListener;
}

function getProxy(vm, expr) {
  let method = vm.$getValidatorMethod(expr);
  if (method == null || method.origFn == null) {
    return null;
  }
  return method.origFn;
}
