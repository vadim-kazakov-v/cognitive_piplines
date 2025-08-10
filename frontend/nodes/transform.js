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
  this.addOutput('data', 'array');
  this.addProperty('field', 'Sex');
  this.color = '#222';
  this.bgcolor = '#444';
  this.fieldWidget = this.addWidget('combo', 'field', this.properties.field, v => (this.properties.field = v), { values: [] });
}
OneHotNode.title = 'One-Hot Encode';
OneHotNode.icon = '📊';
OneHotNode.prototype.updateColumns = function(data) {
  if (!Array.isArray(data) || !data.length) return;
  const cols = Object.keys(data[0]);
  if (this._columns && cols.join(',') === this._columns.join(',')) return;
  this._columns = cols;

  if (this.fieldWidget) {
    this.fieldWidget.options.values = cols;
    if (!cols.includes(this.properties.field)) {
      this.properties.field = cols[0] || '';
      this.fieldWidget.value = this.properties.field;
    }
  }

  this.setSize(this.computeSize());
};

OneHotNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;

  this.updateColumns(data);

  const field = this.properties.field;
  if (!field) return;
  const categories = Array.from(new Set(data.map(r => r[field])));
  const result = data.map(row => {
    const obj = {};
    categories.forEach(cat => {
      obj[`${field}_${cat}`] = row[field] === cat ? 1 : 0;
    });
    return obj;
  });
  this.setOutputData(0, result);
};
registerNode('transform/onehot', OneHotNode);

function LabelEncodeNode() {
  this.addInput('data', 'array');
  this.addOutput('data', 'array');
  this.addProperty('field', 'Sex');
  this.color = '#222';
  this.bgcolor = '#444';
  this.fieldWidget = this.addWidget('combo', 'field', this.properties.field, v => (this.properties.field = v), { values: [] });
}
LabelEncodeNode.title = 'Label Encode';
LabelEncodeNode.icon = '🔢';
LabelEncodeNode.prototype.updateColumns = function(data) {
  if (!Array.isArray(data) || !data.length) return;
  const cols = Object.keys(data[0]);
  if (this._columns && cols.join(',') === this._columns.join(',')) return;
  this._columns = cols;

  if (this.fieldWidget) {
    this.fieldWidget.options.values = cols;
    if (!cols.includes(this.properties.field)) {
      this.properties.field = cols[0] || '';
      this.fieldWidget.value = this.properties.field;
    }
  }

  this.setSize(this.computeSize());
};

LabelEncodeNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;

  this.updateColumns(data);

  const field = this.properties.field;
  if (!field) return;
  const categories = Array.from(new Set(data.map(r => r[field])));
  const mapping = {};
  categories.forEach((cat, i) => (mapping[cat] = i));
  const result = data.map(row => ({ [field]: mapping[row[field]] }));
  this.setOutputData(0, result);
};
registerNode('transform/labelencode', LabelEncodeNode);

function JoinDataFramesNode() {
  this.addInput('left', 'array');
  this.addInput('right', 'array');
  this.addOutput('data', 'array');
  this.color = '#222';
  this.bgcolor = '#444';
}
JoinDataFramesNode.title = 'Join DataFrames';
JoinDataFramesNode.icon = '🔗';
JoinDataFramesNode.prototype.onExecute = function() {
  const left = this.getInputData(0);
  const right = this.getInputData(1);
  if (!Array.isArray(left) || !Array.isArray(right)) return;
  if (left.length !== right.length) return;
  const out = left.map((row, i) => {
    const other = right[i];
    if (Array.isArray(row) && Array.isArray(other)) return row.concat(other);
    if (row && typeof row === 'object' && other && typeof other === 'object')
      return { ...row, ...other };
    return [row, other];
  });
  this.setOutputData(0, out);
};
registerNode('transform/join', JoinDataFramesNode);

