function widgetAreaHeight(node) {
  const count = node.widgets ? node.widgets.length : 0;
  return count * (LiteGraph.NODE_WIDGET_HEIGHT + 4);
}

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

function CsvNode() {
  this.addOutput('data', 'array');
  this.addProperty('url', '');
  this.addProperty('separator', ',');
  this.addProperty('header', true);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('text', 'url', this.properties.url, v => (this.properties.url = v));
  this.addWidget('button', 'load url', null, () => this.loadFromUrl());
  this.addWidget('button', 'file', null, () => this.loadFromFile());
}
CsvNode.title = 'CSV';
CsvNode.icon = '📄';
CsvNode.prototype.parse = function(text) {
  const sep = this.properties.separator || ',';
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  let headers = [];
  let start = 0;
  if (this.properties.header) {
    headers = lines[0].split(sep);
    start = 1;
  } else {
    headers = lines[0].split(sep).map((_, i) => `col${i + 1}`);
  }
  const rows = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(sep);
    const obj = {};
    headers.forEach((h, j) => {
      const val = parts[j];
      const num = Number(val);
      obj[h] = isNaN(num) ? val : num;
    });
    rows.push(obj);
  }
  return rows;
};
CsvNode.prototype.loadFromUrl = async function() {
  const url = this.properties.url;
  if (!url) return;
  try {
    const res = await fetch(url);
    const text = await res.text();
    this._data = this.parse(text);
    this.setOutputData(0, this._data);
  } catch (err) {
    console.error(err);
  }
};
CsvNode.prototype.loadFromFile = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(txt => {
      this._data = this.parse(txt);
      this.setOutputData(0, this._data);
    });
  });
  input.click();
};
CsvNode.prototype.onExecute = function() {
  if (this._data) this.setOutputData(0, this._data);
};
registerNode('data/csv', CsvNode);

function RandomDataNode() {
  this.addOutput('data', 'array');
  this.addProperty('count', 10);
  this.addProperty('columns', 2);
  this.addProperty('min', 0);
  this.addProperty('max', 1);
  this.addProperty('integer', false);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'count', this.properties.count, v => (this.properties.count = v), {
    min: 1,
    max: 100,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'columns', this.properties.columns, v => (this.properties.columns = v), {
    min: 1,
    max: 10,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'min', this.properties.min, v => (this.properties.min = v), {
    min: -100,
    max: 100,
    step: 1,
  });
  this.addWidget('slider', 'max', this.properties.max, v => (this.properties.max = v), {
    min: -100,
    max: 100,
    step: 1,
  });
  this.addWidget('toggle', 'integer', this.properties.integer, v => (this.properties.integer = v));
}
RandomDataNode.title = 'Random Data';
RandomDataNode.icon = '🎲';
RandomDataNode.prototype.onExecute = function() {
  const { count, columns, min, max, integer } = this.properties;
  const rows = Math.max(0, Math.round(count));
  const cols = Math.max(1, Math.round(columns));
  const data = Array.from({ length: rows }, () => {
    const obj = {};
    for (let i = 0; i < cols; i++) {
      let val = Math.random() * (max - min) + min;
      if (integer) val = Math.round(val);
      obj[`col${i + 1}`] = val;
    }
    return obj;
  });
  this.setOutputData(0, data);
};
registerNode('data/random', RandomDataNode);

function RandomSeriesNode() {
  this.addOutput('series', 'array');
  this.addProperty('length', 100);
  this.addProperty('scale', 1);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'length', this.properties.length, v => (this.properties.length = v), {
    min: 1,
    max: 1000,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'scale', this.properties.scale, v => (this.properties.scale = v), {
    min: 0,
    max: 10,
    step: 0.1,
  });
}
RandomSeriesNode.title = 'Random Series';
RandomSeriesNode.icon = '📈';
RandomSeriesNode.prototype.onExecute = function() {
  const len = Math.max(0, Math.round(this.properties.length));
  const scale = this.properties.scale;
  let value = 0;
  const out = [];
  for (let i = 0; i < len; i++) {
    value += (Math.random() * 2 - 1) * scale;
    out.push(value);
  }
  this.setOutputData(0, out);
};
registerNode('data/random_series', RandomSeriesNode);

function SineWaveNode() {
  this.addOutput('series', 'array');
  this.addProperty('length', 100);
  this.addProperty('amplitude', 1);
  this.addProperty('frequency', 1);
  this.addProperty('phase', 0);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'length', this.properties.length, v => (this.properties.length = v), {
    min: 1,
    max: 1000,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'amplitude', this.properties.amplitude, v => (this.properties.amplitude = v), {
    min: 0,
    max: 10,
    step: 0.1,
  });
  this.addWidget('slider', 'frequency', this.properties.frequency, v => (this.properties.frequency = v), {
    min: 0.1,
    max: 10,
    step: 0.1,
  });
  this.addWidget('slider', 'phase', this.properties.phase, v => (this.properties.phase = v), {
    min: 0,
    max: Math.PI * 2,
    step: 0.1,
  });
}
SineWaveNode.title = 'Sine Wave';
SineWaveNode.icon = '🔊';
SineWaveNode.prototype.onExecute = function() {
  const { length, amplitude, frequency, phase } = this.properties;
  const len = Math.max(0, Math.round(length));
  const out = [];
  for (let i = 0; i < len; i++) {
    const t = i / len;
    out.push(amplitude * Math.sin(2 * Math.PI * frequency * t + phase));
  }
  this.setOutputData(0, out);
};
registerNode('data/sine', SineWaveNode);

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

    // build markdown-style table lines
    const fields = Object.keys(out[0] || {});
    const rows = out.map(row => fields.map(f => row[f]));
    const fmt = v => (typeof v === 'number' ? v.toFixed(2) : String(v));
    const colWidths = fields.map((f, i) =>
      Math.max(
        f.length,
        ...rows.map(r => fmt(r[i]).length)
      )
    );
    const lines = [];
    lines.push(
      '| ' + fields.map((f, i) => f.padEnd(colWidths[i])).join(' | ') + ' |'
    );
    lines.push(
      '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |'
    );
    for (const r of rows.slice(0, 10)) {
      lines.push(
        '| ' + r.map((v, i) => fmt(v).padEnd(colWidths[i])).join(' | ') + ' |'
      );
    }
    this._lines = lines;

    const top =
      LiteGraph.NODE_TITLE_HEIGHT +
      widgetAreaHeight(this);
    const lineH = 14;
    this.size[1] = top + lineH * lines.length;
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
  if (!this._lines) return;
  const top =
    LiteGraph.NODE_TITLE_HEIGHT +
    widgetAreaHeight(this);
  const lineH = 14;
  ctx.save();
  ctx.font = '12px monospace';
  ctx.fillStyle = '#fff';
  let y = top + lineH;
  let maxW = 0;
  for (const line of this._lines) {
    ctx.fillText(line, 4, y);
    maxW = Math.max(maxW, ctx.measureText(line).width);
    y += lineH;
  }
  ctx.restore();
  const desiredW = Math.max(120, maxW + 8);
  if (this.size[0] !== desiredW) {
    this.size[0] = desiredW;
    this.setDirtyCanvas(true, true);
  }
};
registerNode('data/describe', DescribeTableNode);

function RandomLabelsNode() {
  this.addInput('data', 'array');
  this.addOutput('labels', 'array');
  this.addProperty('count', 10);
  this.addProperty('classes', 3);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'count', this.properties.count, v => (this.properties.count = v), {
    min: 1,
    max: 100,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'classes', this.properties.classes, v => (this.properties.classes = v), {
    min: 1,
    max: 20,
    step: 1,
    precision: 0,
  });
}
RandomLabelsNode.title = 'Random Labels';
RandomLabelsNode.icon = '🏷️';
RandomLabelsNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  const count = Array.isArray(data)
    ? data.length
    : Math.max(0, Math.round(this.properties.count));
  const cls = Math.max(1, Math.round(this.properties.classes));
  const out = Array.from({ length: count }, () => Math.floor(Math.random() * cls));
  this.setOutputData(0, out);
};
registerNode('data/random_labels', RandomLabelsNode);

function RandomGraphNode() {
  this.addOutput('graph', 'object');
  this.addProperty('nodes', 5);
  this.addProperty('links', 5);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'nodes', this.properties.nodes, v => (this.properties.nodes = v), {
    min: 2,
    max: 50,
    step: 1,
    precision: 0,
  });
  this.addWidget('slider', 'links', this.properties.links, v => (this.properties.links = v), {
    min: 0,
    max: 200,
    step: 1,
    precision: 0,
  });
}
RandomGraphNode.title = 'Random Graph';
RandomGraphNode.icon = '🕸️';
RandomGraphNode.prototype.onExecute = function() {
  const n = Math.max(0, Math.round(this.properties.nodes));
  const m = Math.max(0, Math.round(this.properties.links));
  const nodes = Array.from({ length: n }, (_, i) => `N${i}`);
  const links = [];
  for (let i = 0; i < m; i++) {
    const s = Math.floor(Math.random() * n);
    let t = Math.floor(Math.random() * n);
    if (t === s) t = (t + 1) % n;
    links.push({ source: s, target: t });
  }
  this.setOutputData(0, { nodes, links });
};
registerNode('data/random_graph', RandomGraphNode);

function JsonTemplateNode() {
  this.addOutput('data', 'array');
  this.addProperty('template', '');
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('text', 'template', this.properties.template, v => (this.properties.template = v), { multiline: true });
}
JsonTemplateNode.title = 'JSON Template';
JsonTemplateNode.icon = '🧩';
JsonTemplateNode.prototype._range = function(arr) {
  const [start, end, step] = arr;
  const out = [];
  for (let v = start; step >= 0 ? v <= end + 1e-9 : v >= end - 1e-9; v += step) {
    out.push(Number(v.toFixed(10)));
  }
  return out;
};
JsonTemplateNode.prototype._expand = function(value) {
  if (Array.isArray(value)) {
    if (value.length === 3 && value.every(v => typeof v === 'number')) {
      return this._range(value);
    }
    if (value.every(v => typeof v !== 'object')) {
      return value.slice();
    }
    const parts = value.map(v => this._expand(v));
    const combos = parts.reduce((acc, arr) => {
      const out = [];
      acc.forEach(a => arr.forEach(b => out.push(a.concat([b]))));
      return out;
    }, [[]]);
    return combos;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    const parts = keys.map(k => this._expand(value[k]));
    const combos = parts.reduce((acc, arr) => {
      const out = [];
      acc.forEach(a => arr.forEach(b => out.push(a.concat([b]))));
      return out;
    }, [[]]);
    return combos.map(vals => {
      const obj = {};
      keys.forEach((k, i) => (obj[k] = vals[i]));
      return obj;
    });
  }
  return [value];
};
JsonTemplateNode.prototype.onExecute = function() {
  try {
    const tmpl = this.properties.template && JSON.parse(this.properties.template);
    const out = tmpl ? this._expand(tmpl) : null;
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
    this.setOutputData(0, null);
  }
};
registerNode('data/json_template', JsonTemplateNode);

