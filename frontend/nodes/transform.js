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

