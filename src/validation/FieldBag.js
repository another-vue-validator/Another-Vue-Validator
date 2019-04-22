import Field from './Field';

export default class FieldBag {

  constructor() {
    this.fields = {};
  }

  setFieldFlags(flags) {
    for (let name in this.fields) {
      let field = this.fields[name];
      field.setFlags(flags);
    }
  }

  hasField(name) {
    return this.fields[name] != null;
  }

  getField(name) {
    let field = this.fields[name];
    if (field == null) {
      field = new Field();
      this.fields[name] = field;
    }
    return field;
  }

}
