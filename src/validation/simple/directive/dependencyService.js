'use strict';

import * as utils from "../utils/utils";

let depsByKeypath;

export default {

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
    let depsObj = utils.fromEntries(depsArray);

    Object.keys(depsObj).forEach(keypath => {
      let currKeypathDeps = depsByKeypath[keypath];
      if (!currKeypathDeps) {
        currKeypathDeps = depsByKeypath[keypath] = {};
      }

      // keypath -> 'person.foo'
      // keypathDeps -> { 'person.bar': null, 'person.moo': null }
      let newKeypathDeps = utils.omit(depsObj, keypath);

      // Copy newKeypathDeps onto current keypathDeps
      Object.assign(currKeypathDeps, newKeypathDeps);

      // We end up with this structure
      // depsByKeypath -> { 'person.foo': { 'person.bar': null, 'person.moo': null }}
    });
  },
}
