'use strict';

import ValidationBag from './core/validation-bag';
import Rule from './core/rule';
import Validator from './core/validator';
import mixin from './core/mixin';
import templates from './core/templates';
import avvConfig from './core/config/avvConfig';
import ValidateDirective from './directive/validateDirective';
import * as utils from './utils/utils';

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

let setMode = function( mode ) {
  avvConfig.setMode(mode);
};

export default plugin;

export {
  plugin as avv,
  ValidationBag,
  Rule,
  Validator,
  //mixin,
  setMode,
  extendTemplates,
  utils
};

// module.exports.name = 'SimpleVueValidator';
// module.exports.ValidationBag = ValidationBag;
// module.exports.Rule = Rule;
// module.exports.Validator = Validator;
// module.exports.mixin = mixin;
// module.exports.install = install;
// module.exports.extendTemplates = extendTemplates;
// module.exports.setMode = setMode;
