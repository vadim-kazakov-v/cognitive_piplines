function LogNode() {
  this.addInput('data', 'array');
}
LogNode.title = 'Log';
LogNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (d) console.log(d);
};
registerNode('util/log', LogNode);

