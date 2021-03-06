'use strict';

import * as utils from '../utils/utils';
import Rule from './rule';

let Validator = newValidator();

Validator.create = function (options) {
  return newValidator(options);
};

function newValidator(options) {
  options = options || {};
  let validator = {};

  // clone methods from Rule to validator
  Object.keys(Rule.prototype).forEach(function (methodName) {
    validator[methodName] = function () {
      let rule = new Rule(options.templates);
      return rule[methodName].apply(rule, arguments);
    };
  });

  validator.isEmpty = utils.isEmpty;

  validator.format = utils.format;

  return validator;
}

export default Validator;
