function TitanicNode() {
  this.addOutput('data', 'array');
  this.addProperty('limit', 5);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'limit', this.properties.limit, v => (this.properties.limit = v), { min: 1, max: 50, step: 1, precision: 0 });
}
TitanicNode.title = 'Titanic Sample';
TitanicNode.icon = '🚢';
TitanicNode.prototype.onExecute = async function() {
  if (this._pending) return;
  this._pending = true;
  try {
    const limit = Math.round(this.properties.limit);
    const res = await fetch(`http://localhost:8000/passengers?limit=${limit}`);
    const data = await res.json();
    this.setOutputData(0, data);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};
registerNode('data/titanic', TitanicNode);

function RandomDataNode() {
  this.addOutput('data', 'array');
  this.addProperty('count', 10);
  this.addProperty('min', 0);
  this.addProperty('max', 1);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'count', this.properties.count, v => (this.properties.count = v), { min: 1, max: 100, step: 1, precision: 0 });
  this.addWidget('slider', 'min', this.properties.min, v => (this.properties.min = v), { min: -100, max: 100, step: 1 });
  this.addWidget('slider', 'max', this.properties.max, v => (this.properties.max = v), { min: -100, max: 100, step: 1 });
}
RandomDataNode.title = 'Random Data';
RandomDataNode.icon = '🎲';
RandomDataNode.prototype.onExecute = function() {
  const { count, min, max } = this.properties;
  const data = Array.from({ length: Math.round(count) }, () => Math.random() * (max - min) + min);
  this.setOutputData(0, data);
};
registerNode('data/random', RandomDataNode);

function DescribeTableNode() {
  this.addInput('data', 'array');
  this.addOutput('stats', 'array');
  this.addOutput('status', 'string');
  this.color = '#222';
  this.bgcolor = '#444';
}
DescribeTableNode.title = 'Describe Table';
DescribeTableNode.icon = '📋';
DescribeTableNode.prototype.onExecute = async function() {
  const data = this.getInputData(0);
  if (!data || this._pending) return;
  this._pending = true;
  try {
    const res = await fetch('http://localhost:8000/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const status = res.ok ? 'ok' : `${res.status}`;
    this.setOutputData(1, status);
    if (!res.ok) return;
    const obj = await res.json();
    const out = Object.entries(obj).map(([field, stats]) => ({ field, ...stats }));
    this._stats = out;
    const top =
      LiteGraph.NODE_TITLE_HEIGHT +
      LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
    const lineH = 14;
    this.size[1] = top + lineH * Math.min(out.length, 10);
    this.setDirtyCanvas(true, true);
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
    this.setOutputData(1, err.message || 'error');
  } finally {
    this._pending = false;
  }
};
DescribeTableNode.prototype.onDrawForeground = function(ctx) {
  if (!this._stats) return;
  const top =
    LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const lineH = 14;
  ctx.save();
  ctx.font = '12px monospace';
  ctx.fillStyle = '#fff';
  let y = top + lineH;
  for (const row of this._stats.slice(0, 10)) {
    const text = Object.entries(row)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
      .join(' ');
    ctx.fillText(text, 4, y);
    y += lineH;
  }
  ctx.restore();
};
registerNode('data/describe', DescribeTableNode);

