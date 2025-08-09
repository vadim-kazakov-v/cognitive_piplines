function PythonNode() {
  this.addInput('data', 'array');
  this.addOutput('result', 'array');
  this.addProperty('code', 'lambda x: x');
  this.addWidget('text', 'code', this.properties.code, v => (this.properties.code = v), { multiline: true });
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
PythonNode.prototype.onDrawForeground = function(ctx) {
  const code = this.properties.code;
  if (!code) return;
  const keywords = ['def', 'return', 'lambda', 'import'];
  let x = 4;
  let y = this.size[1] - 20;
  ctx.font = '12px monospace';
  const tokens = code.split(/(\b)/);
  for (const t of tokens) {
    if (keywords.includes(t)) ctx.fillStyle = '#7ff';
    else if (/^[0-9]+$/.test(t)) ctx.fillStyle = '#f7f';
    else ctx.fillStyle = '#fff';
    ctx.fillText(t, x, y);
    x += ctx.measureText(t).width;
  }
};
registerNode('util/python', PythonNode);
