'use strict';

import utils from '../../utils/utils';

export default class EventManager {

  constructor() {
    this.eventData = new Map();
  }

  addEventListeners(el, events, fn, options) {

    events.forEach(event => {
      el.addEventListener(event, fn, options);

      let dataArray = this.eventData.get(el);
      if (dataArray == null) {
        dataArray = dataArray || [];
        this.eventData.set(el, dataArray);
      }

      dataArray.push({
        el: el,
        event: event,
        listener: fn
      });
    });
  }

  removeEventListeners(el, events) {
    console.log('before remove', this.eventData.size);

    //let subList = this.eventData.filter(data => data.el === el);
    // Clone the array so we can remove items below without effecting the loop
    let dataArray = this.eventData.get(el);
    dataArray = dataArray ? dataArray.slice(0) : [];

    dataArray.forEach(data => {
      this._removeEventListener(data, events);
    });
  }

  static getTouchEventNames(el) {

    let name = el.nodeName.toLowerCase();
    if (name === 'input' ||
      name === 'textarea' ||
      name === 'select' ||
      name === 'checkbox' ||
      name === 'radio' ||
      name === 'datalist') {

      return ['blur', 'change'];
    }
    return [];
  }

  static findVModelExpr(vnode, binding) {

    if (vnode == null) {
      return null;
    }

    let expr = null;

    if (binding) {
      expr = binding.value ? binding.value.expr : binding.expression;
    }

    if (expr) {
      return expr;
    }

    if (vnode.data.model) {
      return vnode.data.model.expression;
    }

    if (vnode.data.directives) {
      let model = vnode.data.directives.find(function (directive) { //Search the vModelName attached to the element
        return directive.name === 'model';
      });

      if (model) {
        return model.expression;
      }
    }

    return null;
  }

  _removeEventListener(data, events) {
    if (events) {
      // Only remove listener if contained in given events args
      if (events.includes(data.event)) {
        this._removeListenerAndData(data);
      }

    } else {
      // Always remove listener
      this._removeListenerAndData(data);
    }

    console.log('after remove', this.eventData.size);
  }

  _removeListenerAndData(data) {
    data.el.removeEventListener(data.event, data.listener);
    let dataArray = this.eventData.get(data.el);
    utils.remove(dataArray, data);
    if (dataArray.length === 0) {
      this.eventData.delete(data.el);
    }
  }
}
