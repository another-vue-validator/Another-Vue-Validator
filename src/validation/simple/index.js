'use strict';

import ValidationBag from './validation-bag';
import Rule from './rule';
import Validator from './validator';
import mixin from './mixin';
import templates from './templates';
import avvConfig from '../config/avvConfig';
import ValidateDirective from './directive/validateDirective';

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

export default plugin;

export {
  plugin as avv,
  ValidationBag,
  Rule,
  Validator,
  //mixin,
  extendTemplates
};

// module.exports.name = 'SimpleVueValidator';
// module.exports.ValidationBag = ValidationBag;
// module.exports.Rule = Rule;
// module.exports.Validator = Validator;
// module.exports.mixin = mixin;
// module.exports.install = install;
// module.exports.extendTemplates = extendTemplates;
// module.exports.setMode = setMode;
