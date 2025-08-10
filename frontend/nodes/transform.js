function SelectFieldNode() {
  this.addInput('data', 'array');
  this.addOutput('values', 'array');
  this.addOutput('columns', 'array');
  this.addProperty('field', '');
  this.addProperty('fields', []);
  this.color = '#222';
  this.bgcolor = '#444';

  // dropdown for single field selection
  this.fieldWidget = this.addWidget('combo', 'field', this.properties.field, v => (this.properties.field = v), { values: [] });
  this.checkboxWidgets = [];
}
SelectFieldNode.title = 'Select Field';
SelectFieldNode.icon = '🔍';

SelectFieldNode.prototype.updateColumns = function(data) {
  if (!Array.isArray(data) || !data.length) return;
  const cols = Object.keys(data[0]);
  if (this._columns && cols.join(',') === this._columns.join(',')) return;
  this._columns = cols;

  // update dropdown options
  if (this.fieldWidget) {
    this.fieldWidget.options.values = cols;
    if (!cols.includes(this.properties.field)) {
      this.properties.field = cols[0] || '';
      this.fieldWidget.value = this.properties.field;
    }
  }

  // remove old checkbox widgets
  if (this.checkboxWidgets.length) {
    this.checkboxWidgets.forEach(w => this.removeWidget(w));
    this.checkboxWidgets.length = 0;
  }

  // add checkbox for each column
  this.properties.fields = this.properties.fields || [];
  cols.forEach(col => {
    const checked = this.properties.fields.includes(col);
    const w = this.addWidget('toggle', col, checked, v => {
      if (v) {
        if (!this.properties.fields.includes(col)) this.properties.fields.push(col);
      } else {
        const i = this.properties.fields.indexOf(col);
        if (i !== -1) this.properties.fields.splice(i, 1);
      }
    });
    this.checkboxWidgets.push(w);
  });
  this.setSize(this.computeSize());
};

SelectFieldNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;

  this.updateColumns(data);

  const field = this.properties.field;
  this.setOutputData(0, field ? data.map(r => r[field]) : null);

  const fields = this.properties.fields;
  if (fields && fields.length) {
    const out = data.map(row => {
      const obj = {};
      fields.forEach(f => (obj[f] = row[f]));
      return obj;
    });
    this.setOutputData(1, out);
  } else {
    this.setOutputData(1, null);
  }
};
registerNode('transform/select', SelectFieldNode);

function OneHotNode() {
  this.addInput('data', 'array');
  this.addOutput('matrix', 'array');
  this.addProperty('field', 'Sex');
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('text', 'field', this.properties.field, v => (this.properties.field = v));
}
OneHotNode.title = 'One-Hot Encode';
OneHotNode.icon = '📊';
OneHotNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  const field = this.properties.field;
  const categories = Array.from(new Set(data.map(r => r[field])));
  const map = {};
  categories.forEach((c, i) => (map[c] = i));
  const result = data.map(r => {
    const vec = Array(categories.length).fill(0);
    const idx = map[r[field]];
    if (idx !== undefined) vec[idx] = 1;
    return vec;
  });
  this.setOutputData(0, result);
};
registerNode('transform/onehot', OneHotNode);

