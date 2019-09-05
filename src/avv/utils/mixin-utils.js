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
        return vm.$validate(others, {isDependency: true});
      };

      let depToWatch = depMethod;

      // TODO should we consider the debounce property for dependent validations?
      // if (dep.debounce) {
      //   depToWatch = this.debounce.bind(vm)(keypathToWatch, dep.debounce, depMethod);
      // }
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
      //this.validation.setValid(keypath, true); // TODO should this be true or false?
      // store sessionId
      decoratedValidateMethod.sessionId = this.validation.sessionId;
      debouncedValidateMethod.apply(this, arguments);
    }.bind(this);

    return validateMethodForWatch;
  },

  cache(validator, option) {

    let cacheFn = (...args) => {

      let cache = validator.cache;

      if (!cache) {
        cache = [];
        validator.cache = cache;
      }

      let argsCopy = args.concat([]);
      let ctx = argsCopy.shift(); // ctx is at argsCopy[0], remove it
      let cacheKey = [ctx.value]; // get its value as first item in key
      cacheKey = cacheKey.concat(argsCopy); // append rest of the arguments to the cache key

      let cachedResult = this.findInCache(cache, cacheKey);

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
              cache.push({key: cacheKey, result: promiseResult});
            }
          });

        } else {

          if (option !== 'all') {
            cache.splice(0, cache.length);
          }

          cache.push({key: cacheKey, result: result});
          return result;
        }
      }
    };

    return cacheFn;
  },

  findInCache(cache, args) {
    let items = cache.filter(function (item) {
      let equal = utils.isEqual(args, item.key);
      return equal;
    });

    if (!utils.isEmpty(items)) {
      return items[0].result;
    }
  }
};
