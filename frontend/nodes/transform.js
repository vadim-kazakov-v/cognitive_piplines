function SelectFieldNode() {
  this.addInput('data', 'array');
  this.addOutput('values', 'array');
  this.addProperty('field', 'Fare');
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

