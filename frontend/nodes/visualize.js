function drawPlotArea(ctx, w, h) {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
}

function captureNodeImage(node, drawFunc) {
  const canvas = document.createElement('canvas');
  canvas.width = node.size[0];
  canvas.height = node.size[1];
  const ctx = canvas.getContext('2d');
  const oldZoom = node._zoom;
  const oldOffset = node._offset.slice();
  node._zoom = 1;
  node._offset = [0, 0];
  drawFunc.call(node, ctx);
  node._zoom = oldZoom;
  node._offset = oldOffset;
  return canvas.toDataURL();
}

function BarChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', 'save', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    BarChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'barchart.png';
    a.click();
  });
}
BarChartNode.title = 'Bar Chart';
BarChartNode.icon = '📊';
BarChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._values = data.map(r => r.Fare || 0);
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, BarChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
BarChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const max = Math.max(...this._values) || 1;
  const barWidth = w / this._values.length;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.fillStyle = '#3a7';
  for (let i = 0; i < this._values.length; i++) {
    const v = this._values[i];
    const barHeight = (v / max) * h;
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
  }
  ctx.restore();
};
registerNode('viz/bar', BarChartNode);

function Scatter2DNode() {
  this.addInput('points', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this.resizable = true;
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', 'save', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    Scatter2DNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'scatter.png';
    a.click();
  });
}
Scatter2DNode.title = 'Scatter2D';
Scatter2DNode.icon = '📈';
Scatter2DNode.prototype.onExecute = function() {
  const pts = this.getInputData(0);
  if (!pts) return;
  this._pts = pts;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, Scatter2DNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
Scatter2DNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const xs = this._pts.map(p => p[0]);
  const ys = this._pts.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.fillStyle = '#7af';
  for (const p of this._pts) {
    const x = ((p[0] - minX) / ((maxX - minX) || 1)) * w;
    const y = h - ((p[1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
registerNode('viz/scatter2d', Scatter2DNode);

function LineChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', 'save', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    LineChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'linechart.png';
    a.click();
  });
}
LineChartNode.title = 'Line Chart';
LineChartNode.icon = '📉';
LineChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._values = data;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, LineChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
LineChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const max = Math.max(...this._values);
  const min = Math.min(...this._values);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.strokeStyle = '#faa';
  ctx.beginPath();
  this._values.forEach((v, i) => {
    const x = (i / (this._values.length - 1)) * w;
    const y = h - ((v - min) / ((max - min) || 1)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
};
registerNode('viz/line', LineChartNode);

function HistogramNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', 'save', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    HistogramNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'histogram.png';
    a.click();
  });
}
HistogramNode.title = 'Histogram';
HistogramNode.icon = '📚';
HistogramNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._values = data;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, HistogramNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
HistogramNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const bins = 10;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const min = Math.min(...this._values);
  const max = Math.max(...this._values);
  const binSize = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of this._values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binSize));
    counts[idx]++;
  }
  const maxCount = Math.max(...counts) || 1;
  const barWidth = w / bins;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.fillStyle = '#af7';
  for (let i = 0; i < bins; i++) {
    const barHeight = (counts[i] / maxCount) * h;
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
  }
  ctx.restore();
};
registerNode('viz/hist', HistogramNode);

function drawTableView(ctx, data, props, w, h) {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
  let rows = Array.isArray(data) ? data.slice() : [data];
  if (!rows.length) return;
  if (props.filterColumn && props.filterValue) {
    rows = rows.filter(r => {
      const val = typeof r === 'object' && !Array.isArray(r)
        ? r[props.filterColumn]
        : r[Number(props.filterColumn)];
      return val !== undefined && String(val).includes(props.filterValue);
    });
  }
  if (props.sortColumn) {
    const col = props.sortColumn;
    const dir = props.sortOrder === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const va = typeof a === 'object' && !Array.isArray(a) ? a[col] : a[Number(col)];
      const vb = typeof b === 'object' && !Array.isArray(b) ? b[col] : b[Number(col)];
      if (va == null && vb == null) return 0;
      if (va == null) return -dir;
      if (vb == null) return dir;
      if (va > vb) return dir;
      if (va < vb) return -dir;
      return 0;
    });
  }
  const start = props.page * props.pageSize;
  rows = rows.slice(start, start + props.pageSize);
  if (!rows.length) return;
  let cols;
  if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
    cols = Object.keys(rows[0]);
  } else {
    const len = Array.isArray(rows[0]) ? rows[0].length : 0;
    cols = Array.from({ length: len }, (_, i) => String(i));
  }
  const colWidth = w / cols.length;
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, w, 18);
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  cols.forEach((c, i) => ctx.fillText(c, i * colWidth + 4, 12));
  const maxRows = Math.floor((h - 18) / 16);
  for (let r = 0; r < Math.min(rows.length, maxRows); r++) {
    const rowY = 18 + r * 16;
    if (r % 2) {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, rowY, w, 16);
    }
    ctx.fillStyle = '#fff';
    const row = rows[r];
    cols.forEach((c, i) => {
      const val = typeof row === 'object' && !Array.isArray(row) ? row[c] : row[i];
      const text = val !== undefined ? String(val) : '';
      ctx.fillText(text.slice(0, Math.floor(colWidth / 7)), i * colWidth + 4, rowY + 12);
    });
  }
}

function TableViewNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [300, 200];
  this.resizable = true;
  this.color = '#222';
  this.bgcolor = '#444';
  disableNodeDrag(this);
  this.properties = {
    filterColumn: '',
    filterValue: '',
    sortColumn: '',
    sortOrder: 'asc',
    page: 0,
    pageSize: 10,
  };
  this.addWidget('text', 'filter col', this.properties.filterColumn, v => {
    this.properties.filterColumn = v;
    this.setDirtyCanvas(true, true);
  });
  this.addWidget('text', 'filter val', this.properties.filterValue, v => {
    this.properties.filterValue = v;
    this.setDirtyCanvas(true, true);
  });
  this.addWidget('text', 'sort col', this.properties.sortColumn, v => {
    this.properties.sortColumn = v;
    this.setDirtyCanvas(true, true);
  });
  this.addWidget('combo', 'order', this.properties.sortOrder, v => {
    this.properties.sortOrder = v;
    this.setDirtyCanvas(true, true);
  }, { values: ['asc', 'desc'] });
  this.addWidget('number', 'page', this.properties.page, v => {
    this.properties.page = Math.max(0, Math.floor(v));
    this.setDirtyCanvas(true, true);
  }, { min: 0, step: 1 });
  this.addWidget('number', 'pageSize', this.properties.pageSize, v => {
    this.properties.pageSize = Math.max(1, Math.floor(v));
    this.setDirtyCanvas(true, true);
  }, { min: 1, step: 1 });
}
TableViewNode.title = 'Table';
TableViewNode.icon = '📋';
TableViewNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._data = data;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, TableViewNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
TableViewNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(0, top);
  drawTableView(ctx, this._data, this.properties, w, h);
  ctx.restore();
};
registerNode('viz/table', TableViewNode);

