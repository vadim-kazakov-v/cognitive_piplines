function SelectFieldNode() {
  this.addInput('data', 'array');
  this.addOutput('values', 'array');
  this.addProperty('field', 'Fare');
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('text', 'field', this.properties.field, v => (this.properties.field = v));
}
SelectFieldNode.title = 'Select Field';
SelectFieldNode.icon = '🔍';
SelectFieldNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  const field = this.properties.field;
  this.setOutputData(0, data.map(r => r[field]));
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

