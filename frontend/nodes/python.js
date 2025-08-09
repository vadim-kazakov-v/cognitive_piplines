function PythonNode() {
  this.addInput('data', 'array');
  this.addOutput('result', 'array');
  this.addProperty('code', 'lambda x: x');
}
PythonNode.title = 'Python';
PythonNode.icon = '🐍';
PythonNode.prototype.onExecute = async function() {
  const data = this.getInputData(0);
  if (this._pending) return;
  this._pending = true;
  try {
    const res = await fetch('http://localhost:8000/python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: this.properties.code, data }),
    });
    const out = await res.json();
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};
registerNode('util/python', PythonNode);
