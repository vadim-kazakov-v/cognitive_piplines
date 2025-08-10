function PythonNode() {
  this.addInput('data', 'array');
  // allow returning any datatype from Python scripts
  this.addOutput('result', '*');
  this.addProperty('code', 'lambda x: x');
  this.color = '#222';
  this.bgcolor = '#444';
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
  const lines = code.split('\n');
  ctx.font = '12px monospace';
  let y = this.size[1] - 8;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    let x = 4;
    const tokens = line.split(/(\b)/);
    for (const t of tokens) {
      if (keywords.includes(t)) ctx.fillStyle = '#7ff';
      else if (/^[0-9]+$/.test(t)) ctx.fillStyle = '#f7f';
      else ctx.fillStyle = '#fff';
      ctx.fillText(t, x, y);
      x += ctx.measureText(t).width;
    }
    y -= 14;
    if (y < 0) break;
  }
};
registerNode('util/python', PythonNode);
