function BarChartNode() {
  this.addInput('data', 'array');
}
BarChartNode.title = 'Bar Chart';
BarChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  const ctx = document.getElementById('chart').getContext('2d');
  const labels = data.map((r, i) => r.Name || i);
  const fares = data.map(r => r.Fare || 0);
  if (!this._chart) {
    this._chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Fare', data: fares }] },
    });
  } else {
    this._chart.data.labels = labels;
    this._chart.data.datasets[0].data = fares;
    this._chart.update();
  }
};
registerNode('viz/bar', BarChartNode);

function ScatterPlotNode() {
  this.addInput('points', 'array');
}
ScatterPlotNode.title = 'Scatter Plot';
ScatterPlotNode.prototype.onExecute = function() {
  const pts = this.getInputData(0);
  if (!pts) return;
  const ctx = document.getElementById('chart').getContext('2d');
  const data = pts.map(p => ({x: p[0], y: p[1]}));
  if (!this._chart) {
    this._chart = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: [{ label: 'points', data }] },
    });
  } else {
    this._chart.data.datasets[0].data = data;
    this._chart.update();
  }
};
registerNode('viz/scatter', ScatterPlotNode);

