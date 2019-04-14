'use strict';

import * as utils from './utils';

export default {

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

  debounce(keypath, debounce, validateMethod) {
    // TODO what if custom field name is used?
    let decoratedValidateMethod = function () {

      if (decoratedValidateMethod.sessionId !== this.validation.sessionId) {
        // skip validation if it's reset before
        return Promise.resolve(false);
      }

      return validateMethod.apply(this, arguments);
    }.bind(this);

    let debouncedValidateMethod = utils.debounce(decoratedValidateMethod, parseInt(debounce));

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

      if (!utils.isUndefined(cachedResult)) {
        return cachedResult;
      }

      let result = validator.apply(this, args);

      if (!utils.isUndefined(result)) {

        if (result.then) {

          return result.then(function (promiseResult) {
            if (!utils.isUndefined(promiseResult)) {
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
      return utils.isEqual(args, item.eventData);
    });

    if (!utils.isEmpty(items)) {
      return items[0].result;
    }
  }
}
