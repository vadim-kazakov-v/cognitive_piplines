function BarChartNode() {
  this.addInput('data', 'array');
  this.size = [200, 150];
}
BarChartNode.title = 'Bar Chart';
BarChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._values = data.map(r => r.Fare || 0);
  this.setDirtyCanvas(true);
};
BarChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const w = this.size[0];
  const h = this.size[1];
  const max = Math.max(...this._values) || 1;
  const barWidth = w / this._values.length;
  ctx.fillStyle = '#3a7';
  for (let i = 0; i < this._values.length; i++) {
    const v = this._values[i];
    const barHeight = (v / max) * h;
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
  }
};
registerNode('viz/bar', BarChartNode);

function ScatterPlotNode() {
  this.addInput('points', 'array');
  this.size = [200, 150];
}
ScatterPlotNode.title = 'Scatter Plot';
ScatterPlotNode.prototype.onExecute = function() {
  const pts = this.getInputData(0);
  if (!pts) return;
  this._pts = pts;
  this.setDirtyCanvas(true);
};
ScatterPlotNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const w = this.size[0];
  const h = this.size[1];
  const xs = this._pts.map(p => p[0]);
  const ys = this._pts.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.fillStyle = '#7af';
  for (const p of this._pts) {
    const x = ((p[0] - minX) / ((maxX - minX) || 1)) * w;
    const y = h - ((p[1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};
registerNode('viz/scatter', ScatterPlotNode);

