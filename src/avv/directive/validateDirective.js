'use strict';

import EventManager from './EventManager';
import dependencyService from './dependencyService';

let eventManager = new EventManager();

export default {

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

    setupDependencies(expr, vm);

    if (showOnError(binding)) {
      vm.validation.setTouched(expr, true);
      // TODO What else should we flag to ensure error is always shown?
      return;
    }

    eventManager.addEventListeners(el, eventNames, getTouchListener(el, vm, expr));
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

    console.log(evt.type);
  };

  return touchListener;
}
