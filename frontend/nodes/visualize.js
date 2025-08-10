function drawPlotArea(ctx, w, h) {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
}

function BarChartNode() {
  this.addInput('data', 'array');
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

