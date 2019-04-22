'use strict';

import modes from './modes';

export default {
  mode: modes.INTERACTIVE, // other values: conservative and manual

  getMode() {
    return this.mode;
  },

  setMode(val) {
    if (modes[val] == null) {
      throw new Error('Invalid mode: ' + val);
    }
    this.mode = val;
  }
}
