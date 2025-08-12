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
  const hadZoom = typeof node._zoom === 'number';
  const hadOffset = Array.isArray(node._offset);
  const oldZoom = hadZoom ? node._zoom : 1;
  const oldOffset = hadOffset ? node._offset.slice() : [0, 0];
  node._zoom = 1;
  node._offset = [0, 0];
  drawFunc.call(node, ctx);
  if (hadZoom) node._zoom = oldZoom; else delete node._zoom;
  if (hadOffset) node._offset = oldOffset; else delete node._offset;
  return canvas.toDataURL();
}

const COLOR_PALETTE = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];

function labelColor(v) {
  if (v === undefined || v === null) return '#7af';
  if (typeof v === 'string') return v;
  if (v === -1) return '#888';
  return COLOR_PALETTE[v % COLOR_PALETTE.length];
}

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function setupFieldSelector(node) {
  node.addProperty('field', '');
  node._fieldWidget = node.addWidget(
    'combo',
    'field',
    node.properties.field,
    v => (node.properties.field = v),
    { values: [] }
  );
  node.updateFieldSelector = function(data) {
    if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') return;
    const cols = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');
    if (this._columns && cols.join(',') === this._columns.join(',')) return;
    this._columns = cols;
    this._fieldWidget.options.values = cols;
    if (!cols.includes(this.properties.field)) {
      this.properties.field = cols[0] || '';
      this._fieldWidget.value = this.properties.field;
    }
  };
}

function setupLabelValueSelectors(node) {
  node.addProperty('label', '');
  node.addProperty('value', '');
  node._labelWidget = node.addWidget(
    'combo',
    'label',
    node.properties.label,
    v => (node.properties.label = v),
    { values: [] }
  );
  node._valueWidget = node.addWidget(
    'combo',
    'value',
    node.properties.value,
    v => (node.properties.value = v),
    { values: [] }
  );
  node.updateFieldSelectors = function(data) {
    if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') return;
    const cols = Object.keys(data[0]);
    if (this._columns && cols.join(',') === this._columns.join(',')) return;
    this._columns = cols;
    this._labelWidget.options.values = cols;
    const numeric = cols.filter(k => typeof data[0][k] === 'number');
    this._valueWidget.options.values = numeric;
    if (!cols.includes(this.properties.label)) {
      this.properties.label = cols[0] || '';
      this._labelWidget.value = this.properties.label;
    }
    if (!numeric.includes(this.properties.value)) {
      this.properties.value = numeric[0] || '';
      this._valueWidget.value = this.properties.value;
    }
  };
}

function BarChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  setupFieldSelector(this);
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    BarChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'barchart.png';
    a.click();
  }, { width: 30 });
}
BarChartNode.title = 'Bar Chart';
BarChartNode.icon = '📊';
BarChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this.updateFieldSelector(data);
  let vals;
  if (Array.isArray(data)) {
    if (typeof data[0] === 'object') {
      const f = this.properties.field;
      if (!f) return;
      vals = data.map(r => Number(r[f] || 0));
    } else {
      vals = data.map(v => Number(v));
    }
  }
  this._values = vals;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, BarChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
BarChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
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
  this.addInput('color', 'array');
  this.addInput('size', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this.resizable = true;
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    Scatter2DNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'scatter.png';
    a.click();
  }, { width: 30 });
}
Scatter2DNode.title = 'Scatter2D';
Scatter2DNode.icon = '📈';
Scatter2DNode.prototype.onExecute = function() {
  const pts = this.getInputData(0);
  if (!pts) return;
  this._pts = pts;
  this._colors = this.getInputData(1);
  this._sizes = this.getInputData(2);
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, Scatter2DNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
Scatter2DNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
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
  for (let i = 0; i < this._pts.length; i++) {
    const p = this._pts[i];
    const x = ((p[0] - minX) / ((maxX - minX) || 1)) * w;
    const y = h - ((p[1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.fillStyle = labelColor(this._colors && this._colors[i]);
    ctx.beginPath();
    const r = this._sizes && this._sizes[i] ? Math.max(1, Number(this._sizes[i])) : 3;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
registerNode('viz/scatter2d', Scatter2DNode);

function Scatter3DNode() {
  this.addInput('points', 'array');
  this.addInput('color', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this.resizable = true;
  this.color = '#222';
  this.bgcolor = '#444';
  this._rot = [0, 0];
  this._zoom = 1;
  this.addWidget('button', '💾', null, () => {
    if (!this._glcanvas) return;
    const a = document.createElement('a');
    a.href = this._glcanvas.toDataURL();
    a.download = 'scatter3d.png';
    a.click();
  }, { width: 30 });
  this.onMouseDown = function(e) {
    const header = LiteGraph.NODE_TITLE_HEIGHT;
    const widgets = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
    const limit = header + widgets;
    const localX = e.canvasX - this.pos[0];
    const localY = e.canvasY - this.pos[1];
    const inResize = localX > this.size[0] - 10 && localY > this.size[1] - 10;
    if (localY < limit || inResize) return false;
    this._dragging = true;
    this._last = [e.canvasX, e.canvasY];
    this.captureInput(true);
    return true;
  };
  this.onMouseMove = function(e) {
    if (this._dragging) {
      const dx = e.canvasX - this._last[0];
      const dy = e.canvasY - this._last[1];
      this._rot[0] += dy * 0.01;
      this._rot[1] += dx * 0.01;
      this._last = [e.canvasX, e.canvasY];
      this.setDirtyCanvas(true, true);
      return true;
    }
    return false;
  };
  this.onMouseUp = function() {
    this._dragging = false;
    this.captureInput(false);
    return false;
  };
  this.onMouseWheel = function(e) {
    const delta = e.wheelDeltaY ? e.wheelDeltaY : -e.deltaY;
    this._zoom *= delta > 0 ? 1.1 : 0.9;
    this.setDirtyCanvas(true, true);
    return true;
  };
}
Scatter3DNode.title = 'Scatter3D';
Scatter3DNode.icon = '🟦';
Scatter3DNode.prototype.onExecute = function() {
  const pts = this.getInputData(0);
  if (!pts) return;
  this._pts = pts;
  this._colors = this.getInputData(1);
  if (this._img) this.setOutputData(0, this._img);
  this.setDirtyCanvas(true, true);
};
Scatter3DNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  if (!this._glcanvas || this._glcanvas.width !== w || this._glcanvas.height !== h) {
    this._glcanvas = document.createElement('canvas');
    this._glcanvas.width = w;
    this._glcanvas.height = h;
    const gl = this._glcanvas.getContext('webgl', { preserveDrawingBuffer: true });
    this._gl = gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec3 aPos;attribute vec3 aColor;varying vec3 vColor;void main(){vColor=aColor;gl_Position=vec4(aPos,1.0);gl_PointSize=4.0;}');
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}');
    gl.compileShader(fs);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    this._program = program;
    this._posLoc = gl.getAttribLocation(program, 'aPos');
    this._colorLoc = gl.getAttribLocation(program, 'aColor');
    this._buffer = gl.createBuffer();
    this._colorBuffer = gl.createBuffer();
  }
  const gl = this._gl;
  gl.viewport(0, 0, w, h);
  gl.clearColor(0.133, 0.133, 0.133, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const pts = this._pts;
  const xs = pts.map(p => (Array.isArray(p) ? p[0] : p.x));
  const ys = pts.map(p => (Array.isArray(p) ? p[1] : p.y));
  const zs = pts.map(p => (Array.isArray(p) ? p[2] : p.z));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const rx = this._rot[0], ry = this._rot[1], scale = this._zoom;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);

  function transform(px, py, pz) {
    let x = (px - minX) / ((maxX - minX) || 1) * 2 - 1;
    let y = (py - minY) / ((maxY - minY) || 1) * 2 - 1;
    let z = (pz - minZ) / ((maxZ - minZ) || 1) * 2 - 1;
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    let x2 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;
    x2 *= scale;
    y1 *= scale;
    const depth = z2 + 3;
    return [x2 / depth, y1 / depth];
  }

  const data = new Float32Array(pts.length * 3);
  const colorData = new Float32Array(pts.length * 3);
  const cols = this._colors || [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const px = Array.isArray(p) ? p[0] : p.x;
    const py = Array.isArray(p) ? p[1] : p.y;
    const pz = Array.isArray(p) ? p[2] : p.z;
    const t = transform(px, py, pz);
    data[i * 3] = t[0];
    data[i * 3 + 1] = t[1];
    data[i * 3 + 2] = 0;
    const rgb = hexToRgb(labelColor(cols[i]));
    colorData[i * 3] = rgb[0] / 255;
    colorData[i * 3 + 1] = rgb[1] / 255;
    colorData[i * 3 + 2] = rgb[2] / 255;
  }

  gl.useProgram(this._program);
  gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(this._posLoc);
  gl.vertexAttribPointer(this._posLoc, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(this._colorLoc);
  gl.vertexAttribPointer(this._colorLoc, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.POINTS, 0, pts.length);

  this._img = this._glcanvas.toDataURL();

  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const axisPoints = [
    transform(minX, cy, cz), transform(maxX, cy, cz),
    transform(cx, minY, cz), transform(cx, maxY, cz),
    transform(cx, cy, minZ), transform(cx, cy, maxZ)
  ];

  ctx.save();
  ctx.translate(0, top);
  ctx.drawImage(this._glcanvas, 0, 0);
  const axisColors = ['#f55', '#5f5', '#55f'];
  for (let i = 0; i < axisPoints.length; i += 2) {
    const a = axisPoints[i];
    const b = axisPoints[i + 1];
    const ax = (a[0] * 0.5 + 0.5) * w;
    const ay = (1 - (a[1] * 0.5 + 0.5)) * h;
    const bx = (b[0] * 0.5 + 0.5) * w;
    const by = (1 - (b[1] * 0.5 + 0.5)) * h;
    ctx.strokeStyle = axisColors[i / 2];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.restore();
  this.setOutputData(0, this._img);
};
registerNode('viz/scatter3d', Scatter3DNode);

function LineChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  setupFieldSelector(this);
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    LineChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'linechart.png';
    a.click();
  }, { width: 30 });
}
LineChartNode.title = 'Line Chart';
LineChartNode.icon = '📉';
LineChartNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this.updateFieldSelector(data);
  let vals;
  if (Array.isArray(data)) {
    if (typeof data[0] === 'object') {
      const f = this.properties.field;
      if (!f) return;
      vals = data.map(r => Number(r[f] || 0));
    } else {
      vals = data.map(v => Number(v));
    }
  }
  this._values = vals;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, LineChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
LineChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
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
  setupFieldSelector(this);
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    HistogramNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'histogram.png';
    a.click();
  }, { width: 30 });
}
HistogramNode.title = 'Histogram';
HistogramNode.icon = '📚';
HistogramNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this.updateFieldSelector(data);
  let vals;
  if (Array.isArray(data)) {
    if (typeof data[0] === 'object') {
      const f = this.properties.field;
      if (!f) return;
      vals = data.map(r => Number(r[f] || 0));
    } else {
      vals = data.map(v => Number(v));
    }
  }
  this._values = vals;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, HistogramNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
HistogramNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const bins = 10;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
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

function HeatmapNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    HeatmapNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'heatmap.png';
    a.click();
  }, { width: 30 });
}
HeatmapNode.title = 'Heatmap';
HeatmapNode.icon = '🌡️';
HeatmapNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._values = data;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, HeatmapNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
HeatmapNode.prototype.onDrawBackground = function(ctx) {
  if (!this._values) return;
  const rows = this._values.length;
  const cols = Array.isArray(this._values[0]) ? this._values[0].length : 0;
  if (!rows || !cols) return;
  const flat = this._values.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const cellW = w / cols;
  const cellH = h / rows;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = this._values[r][c];
      const t = (v - min) / ((max - min) || 1);
      const hue = (1 - t) * 240;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
    }
  }
  ctx.restore();
};
registerNode('viz/heatmap', HeatmapNode);

function CorrelationMapNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    CorrelationMapNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'corrmap.png';
    a.click();
  }, { width: 30 });
}
CorrelationMapNode.title = 'Correlation Map';
CorrelationMapNode.icon = '🔗';
CorrelationMapNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!Array.isArray(data) || !data.length) return;
  const keys = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');
  if (!keys.length) return;
  const cols = keys.map(k => data.map(r => Number(r[k] || 0)));
  const n = cols.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  function corr(a, b) {
    const m1 = a.reduce((s, v) => s + v, 0) / a.length;
    const m2 = b.reduce((s, v) => s + v, 0) / b.length;
    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i] - m1;
      const y = b[i] - m2;
      num += x * y;
      d1 += x * x;
      d2 += y * y;
    }
    return num / Math.sqrt(d1 * d2 || 1);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = corr(cols[i], cols[j]);
    }
  }
  this._matrix = matrix;
  this._columns = keys;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, CorrelationMapNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
CorrelationMapNode.prototype.onDrawBackground = function(ctx) {
  if (!this._matrix) return;
  const labels = this._columns;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const labelSize = 40;
  const cellW = (w - labelSize) / labels.length;
  const cellH = (h - labelSize) / labels.length;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  for (let r = 0; r < labels.length; r++) {
    for (let c = 0; c < labels.length; c++) {
      const v = this._matrix[r][c];
      const t = (v + 1) / 2;
      const hue = (1 - t) * 240;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(labelSize + c * cellW, labelSize + r * cellH, cellW, cellH);
    }
  }
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  for (let i = 0; i < labels.length; i++) {
    ctx.fillText(labels[i], labelSize + i * cellW + 4, 12);
    ctx.fillText(labels[i], 4, labelSize + i * cellH + cellH / 2 + 4);
  }
  ctx.restore();
};
registerNode('viz/corrmap', CorrelationMapNode);

function drawTableView(ctx, data, props, w, h, state) {
  const headerH = 18;
  const paginationH = 20;
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
  let rows = Array.isArray(data) ? data.slice() : [data];
  if (!rows.length) return;
  // if array contains primitive values (numbers, strings, etc.),
  // wrap them into objects so the table can show a "value" column
  if (typeof rows[0] !== 'object' || rows[0] === null || Array.isArray(rows[0])) {
    rows = rows.map(v => ({ value: v }));
  }
  if (props.search) {
    const s = props.search.toLowerCase();
    rows = rows.filter(r => {
      const vals = typeof r === 'object' && !Array.isArray(r)
        ? Object.values(r)
        : r;
      return vals && vals.some(v => String(v).toLowerCase().includes(s));
    });
  }
  let cols;
  if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
    cols = Object.keys(rows[0]);
  } else {
    const len = Array.isArray(rows[0]) ? rows[0].length : 0;
    cols = Array.from({ length: len }, (_, i) => String(i));
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
  ctx.font = '12px monospace';
  const colWidths = cols.map((c, i) => {
    let max = ctx.measureText(c).width + 8;
    rows.forEach(r => {
      const val = typeof r === 'object' && !Array.isArray(r) ? r[c] : r[i];
      const text = val !== undefined ? String(val) : '';
      max = Math.max(max, ctx.measureText(text).width + 8);
    });
    return max;
  });
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const scale = w / totalW;
  const colRects = [];
  let x = 0;
  for (let i = 0; i < colWidths.length; i++) {
    const cw = colWidths[i] * scale;
    colRects.push({ x, w: cw, name: cols[i] });
    x += cw;
  }
  const tableH = h - paginationH;
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = '#fff';
  colRects.forEach((r, i) => {
    let title = cols[i];
    if (props.sortColumn === cols[i]) title += props.sortOrder === 'asc' ? ' ▲' : ' ▼';
    ctx.fillText(title, r.x + 4, 12);
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / props.pageSize));
  const page = Math.min(props.page, totalPages - 1);
  if (page !== props.page) props.page = page;
  const start = page * props.pageSize;
  const pageRows = rows.slice(start, start + props.pageSize);
  const maxRows = Math.floor((tableH - headerH) / 16);
  for (let r = 0; r < Math.min(pageRows.length, maxRows); r++) {
    const rowY = headerH + r * 16;
    if (r % 2) {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, rowY, w, 16);
    }
    ctx.fillStyle = '#fff';
    const row = pageRows[r];
    colRects.forEach((c, i) => {
      const val = typeof row === 'object' && !Array.isArray(row) ? row[c.name] : row[i];
      const text = val !== undefined ? String(val) : '';
      ctx.fillText(text.slice(0, Math.floor(c.w / 7)), c.x + 4, rowY + 12);
    });
  }
  const pagY = tableH;
  ctx.fillStyle = '#333';
  ctx.fillRect(0, pagY, w, paginationH);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Page ${page + 1}/${totalPages}`, w / 2 - 30, pagY + 14);
  ctx.fillStyle = '#555';
  ctx.fillRect(4, pagY + 2, 40, 16);
  ctx.fillRect(w - 44, pagY + 2, 40, 16);
  ctx.fillStyle = '#fff';
  ctx.fillText('Prev', 8, pagY + 14);
  ctx.fillText('Next', w - 40, pagY + 14);
  if (state) {
    state.headerH = headerH;
    state.colRects = colRects;
    state.totalPages = totalPages;
    state.pagination = {
      height: paginationH,
      prev: { x: 4, y: pagY + 2, w: 40, h: 16 },
      next: { x: w - 44, y: pagY + 2, w: 40, h: 16 }
    };
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
    search: '',
    sortColumn: '',
    sortOrder: 'asc',
    page: 0,
    pageSize: 10,
  };
  this.addWidget('text', 'search', this.properties.search, v => {
    this.properties.search = v;
    this.properties.page = 0;
    adjustTableSize.call(this);
    this.setDirtyCanvas(true, true);
  }, { property: 'search' });

  this.onMouseDown = function(e) {
    if (!this._tableState) return false;
    const header = LiteGraph.NODE_TITLE_HEIGHT;
    const widgetsH = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
    const limit = header + widgetsH;
    const localX = e.canvasX - this.pos[0];
    const localY = e.canvasY - this.pos[1];
    if (localY < limit || localY > this.size[1]) return false;
    const y = localY - limit;
    const state = this._tableState;
    if (y < state.headerH) {
      for (const c of state.colRects) {
        if (localX >= c.x && localX <= c.x + c.w) {
          if (this.properties.sortColumn === c.name) {
            this.properties.sortOrder = this.properties.sortOrder === 'asc' ? 'desc' : 'asc';
          } else {
            this.properties.sortColumn = c.name;
            this.properties.sortOrder = 'asc';
          }
          this.setDirtyCanvas(true, true);
          return true;
        }
      }
    } else if (y > (this.size[1] - limit - state.pagination.height)) {
      const p = state.pagination;
      if (localX >= p.prev.x && localX <= p.prev.x + p.prev.w) {
        this.properties.page = Math.max(0, this.properties.page - 1);
        this.setDirtyCanvas(true, true);
        return true;
      }
      if (localX >= p.next.x && localX <= p.next.x + p.next.w) {
        this.properties.page = Math.min(state.totalPages - 1, this.properties.page + 1);
        this.setDirtyCanvas(true, true);
        return true;
      }
    }
    return false;
  };
}
TableViewNode.title = 'Table';
TableViewNode.icon = '📋';
TableViewNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  this._data = data;
  adjustTableSize.call(this);
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, TableViewNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
TableViewNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(0, top);
  this._tableState = {};
  drawTableView(ctx, this._data, this.properties, w, h, this._tableState);
  ctx.restore();
};

function adjustTableSize() {
  if (!this._data) return;
  let rows = Array.isArray(this._data) ? this._data.slice() : [this._data];
  // wrap primitive entries so the table can display them
  if (rows.length && (typeof rows[0] !== 'object' || rows[0] === null || Array.isArray(rows[0]))) {
    rows = rows.map(v => ({ value: v }));
  }
  if (this.properties.search) {
    const s = this.properties.search.toLowerCase();
    rows = rows.filter(r => {
      const vals = typeof r === 'object' && !Array.isArray(r) ? Object.values(r) : r;
      return vals && vals.some(v => String(v).toLowerCase().includes(s));
    });
  }
  const headerH = 18;
  const paginationH = 20;
  const visible = Math.min(rows.length, this.properties.pageSize);
  const tableH = headerH + visible * 16 + paginationH;
  const top = LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  this.size[1] = top + tableH;
}
registerNode('viz/table', TableViewNode);

function LissajousNode() {
  this.addInput('x', 'array');
  this.addInput('y', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    LissajousNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'lissajous.png';
    a.click();
  }, { width: 30 });
}
LissajousNode.title = 'Lissajous';
LissajousNode.icon = '∞';
LissajousNode.prototype.onExecute = function() {
  const x = this.getInputData(0);
  const y = this.getInputData(1);
  if (!x || !y) return;
  this._x = x;
  this._y = y;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, LissajousNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
LissajousNode.prototype.onDrawBackground = function(ctx) {
  if (!this._x || !this._y) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const xs = this._x;
  const ys = this._y;
  const n = Math.min(xs.length, ys.length);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.strokeStyle = '#7af';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const px = ((xs[i] - minX) / ((maxX - minX) || 1)) * w;
    const py = h - ((ys[i] - minY) / ((maxY - minY) || 1)) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
};
registerNode('viz/lissajous', LissajousNode);

function ParallelCoordsNode() {
  this.addInput('data', 'array');
  this.addInput('color', 'array');
  this.addOutput('image', 'string');
  this.size = [300, 200];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    ParallelCoordsNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'parallel.png';
    a.click();
  }, { width: 30 });
}
ParallelCoordsNode.title = 'Parallel Coords';
ParallelCoordsNode.icon = '🕸️';
ParallelCoordsNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (!d) return;
  this._data = d;
  this._colors = this.getInputData(1);
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, ParallelCoordsNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
ParallelCoordsNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data || !this._data.length) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const keys = Object.keys(this._data[0] || {}).filter(k => typeof this._data[0][k] === 'number');
  if (keys.length < 2) return;
  const ranges = {};
  keys.forEach(k => { ranges[k] = { min: Infinity, max: -Infinity }; });
  this._data.forEach(r => {
    keys.forEach(k => {
      const v = r[k];
      if (typeof v === 'number') {
        if (v < ranges[k].min) ranges[k].min = v;
        if (v > ranges[k].max) ranges[k].max = v;
      }
    });
  });
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  const step = w / (keys.length - 1);
  const cols = this._colors || [];
  ctx.globalAlpha = 0.5;
  this._data.forEach((row, idx) => {
    ctx.beginPath();
    keys.forEach((k, i) => {
      const r = ranges[k];
      const v = row[k];
      const x = i * step;
      const y = h - ((v - r.min) / ((r.max - r.min) || 1)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = labelColor(cols[idx]);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#999';
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#fff';
  keys.forEach((k, i) => {
    const x = i * step;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.fillText(k, x + 2, 12);
  });
  ctx.restore();
};
registerNode('viz/parallel', ParallelCoordsNode);

function PieChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  setupLabelValueSelectors(this);
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    PieChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'piechart.png';
    a.click();
  }, { width: 30 });
}
PieChartNode.title = 'Pie Chart';
PieChartNode.icon = '🥧';
PieChartNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (!d) return;
  this.updateFieldSelectors(d);
  let entries;
  if (Array.isArray(d)) {
    if (typeof d[0] === 'object' && this.properties.label && this.properties.value) {
      entries = d.map(r => [String(r[this.properties.label]), Number(r[this.properties.value] || 0)]);
    } else {
      entries = d.map((v, i) => [String(i), Number(v)]);
    }
  } else if (d && typeof d === 'object') {
    entries = Object.entries(d);
  }
  this._entries = entries;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, PieChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
PieChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._entries) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 4;
  const entries = this._entries;
  const total = entries.reduce((a, [, v]) => a + (Number(v) || 0), 0);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  let start = 0;
  entries.forEach(([label, value], i) => {
    const angle = total ? (value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.fillStyle = COLOR_PALETTE[i % COLOR_PALETTE.length];
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fill();
    start += angle;
  });
  ctx.restore();
};
registerNode('viz/pie', PieChartNode);

function SankeyNode() {
  this.addInput('data', 'object');
  this.addOutput('image', 'string');
  this.size = [300, 200];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    SankeyNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'sankey.png';
    a.click();
  }, { width: 30 });
}
SankeyNode.title = 'Sankey';
SankeyNode.icon = '🔀';
SankeyNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (!d) return;
  this._data = d;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, SankeyNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
SankeyNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const nodes = this._data.nodes || [];
  const links = this._data.links || [];
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  if (!nodes.length) { ctx.restore(); return; }
  const levels = new Array(nodes.length).fill(0);
  links.forEach(l => { levels[l.target] = Math.max(levels[l.target], levels[l.source] + 1); });
  const maxLevel = Math.max(...levels);
  const xStep = w / (maxLevel + 1);
  const levelGroups = {};
  levels.forEach((lvl, idx) => {
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(idx);
  });
  const positions = new Array(nodes.length);
  Object.keys(levelGroups).forEach(lvl => {
    const arr = levelGroups[lvl];
    const yStep = h / (arr.length + 1);
    arr.forEach((idx, j) => {
      positions[idx] = { x: lvl * xStep + 10, y: (j + 1) * yStep };
    });
  });
  links.forEach((l, i) => {
    const s = positions[l.source];
    const t = positions[l.target];
    if (!s || !t) return;
    const val = l.value || 1;
    ctx.strokeStyle = COLOR_PALETTE[i % COLOR_PALETTE.length];
    ctx.lineWidth = Math.max(1, val);
    ctx.beginPath();
    ctx.moveTo(s.x + 20, s.y);
    ctx.bezierCurveTo((s.x + t.x) / 2, s.y, (s.x + t.x) / 2, t.y, t.x - 20, t.y);
    ctx.stroke();
  });
  nodes.forEach((node, i) => {
    const p = positions[i];
    if (!p) return;
    const name = typeof node === 'object' ? node.name : node;
    ctx.fillStyle = '#888';
    ctx.fillRect(p.x - 10, p.y - 5, 20, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(String(name), p.x - 10, p.y - 7);
  });
  ctx.restore();
};
registerNode('viz/sankey', SankeyNode);

function ViolinChartNode() {
  this.addInput('data', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    ViolinChartNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'violin.png';
    a.click();
  }, { width: 30 });
}
ViolinChartNode.title = 'Violin';
ViolinChartNode.icon = '🎻';
ViolinChartNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (!d) return;
  this._data = d;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, ViolinChartNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
ViolinChartNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data || !this._data.length) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const values = this._data.map(Number).filter(v => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!(max > min)) return;
  const bandwidth = (max - min) / 20;
  const kernel = u => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  const steps = 40;
  const ys = [];
  const densities = [];
  for (let i = 0; i <= steps; i++) {
    const y = min + (i / steps) * (max - min);
    ys.push(y);
    const d = values.reduce((sum, v) => sum + kernel((y - v) / bandwidth), 0) / (values.length * bandwidth);
    densities.push(d);
  }
  const maxD = Math.max(...densities);
  const scale = (w / 2 - 4) / (maxD || 1);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.fillStyle = '#7af';
  ctx.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = h - ((ys[i] - min) / (max - min)) * h;
    const x = densities[i] * scale;
    if (i === 0) ctx.moveTo(w / 2 + x, y);
    else ctx.lineTo(w / 2 + x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = h - ((ys[i] - min) / (max - min)) * h;
    const x = densities[i] * scale;
    ctx.lineTo(w / 2 - x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
registerNode('viz/violin', ViolinChartNode);

function GraphVizNode() {
  this.addInput('graph', 'object');
  this.addOutput('image', 'string');
  this.size = [300, 200];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    GraphVizNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'graph.png';
    a.click();
  }, { width: 30 });
}
GraphVizNode.title = 'Graph';
GraphVizNode.icon = '🕸️';
GraphVizNode.prototype.onExecute = function() {
  const g = this.getInputData(0);
  if (!g) return;
  this._data = g;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, GraphVizNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
GraphVizNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const nodes = this._data.nodes || [];
  const links = this._data.links || [];
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  const n = nodes.length;
  const positions = nodes.map((_, i) => {
    const angle = (i / n) * Math.PI * 2;
    return {
      x: (Math.cos(angle) * 0.4 + 0.5) * w,
      y: (Math.sin(angle) * 0.4 + 0.5) * h,
    };
  });
  ctx.strokeStyle = '#888';
  links.forEach(l => {
    const s = positions[l.source];
    const t = positions[l.target];
    if (!s || !t) return;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
  });
  positions.forEach((p, i) => {
    ctx.fillStyle = COLOR_PALETTE[i % COLOR_PALETTE.length];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    const label = String(nodes[i]);
    ctx.fillText(label, p.x - ctx.measureText(label).width / 2, p.y - 14);
  });
  ctx.restore();
};
registerNode('viz/graph', GraphVizNode);

function GlyphsNode() {
  this.addInput('data', 'array');
  this.addInput('color', 'array');
  this.addOutput('image', 'string');
  this.size = [300, 200];
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('button', '💾', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    GlyphsNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'glyphs.png';
    a.click();
  }, { width: 30 });
}
GlyphsNode.title = 'Glyphs';
GlyphsNode.icon = '⭐';
GlyphsNode.prototype.onExecute = function() {
  const input = this.getInputData(0);
  if (!Array.isArray(input) || !input.length) return;

  let data = input;
  if (!Array.isArray(input[0])) {
    const row = input[0];
    if (row && typeof row === 'object') {
      const keys = Object.keys(row);
      data = input.map(r => keys.map(k => parseFloat(r[k])));
    } else {
      return;
    }
  }

  this._data = data;
  this._colors = this.getInputData(1);
  const dims = data[0] ? data[0].length : 0;
  const mins = Array(dims).fill(Infinity);
  const maxs = Array(dims).fill(-Infinity);
  data.forEach(row => {
    row.forEach((v, i) => {
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    });
  });
  this._mins = mins;
  this._maxs = maxs;
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, GlyphsNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
GlyphsNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const data = this._data;
  const mins = this._mins;
  const maxs = this._maxs;
  const dims = mins.length;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  const cols = Math.ceil(Math.sqrt(data.length));
  const rows = Math.ceil(data.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  data.forEach((row, idx) => {
    const cx = (idx % cols) * cellW + cellW / 2;
    const cy = Math.floor(idx / cols) * cellH + cellH / 2;
    const radius = Math.min(cellW, cellH) / 2 - 4;
    ctx.beginPath();
    for (let i = 0; i < dims; i++) {
      const angle = (i / dims) * Math.PI * 2 - Math.PI / 2;
      const norm = (row[i] - mins[i]) / ((maxs[i] - mins[i]) || 1);
      const r = radius * norm;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = labelColor(this._colors && this._colors[idx]);
    ctx.stroke();
  });
  ctx.restore();
};
registerNode('viz/glyphs', GlyphsNode);

function VoronoiNode() {
  this.addInput('points', 'array');
  this.addInput('color', 'array');
  this.addOutput('image', 'string');
  this.addProperty('x', 'col1');
  this.addProperty('y', 'col2');
  this.size = [200, 150];
  this.resizable = true;
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('text', 'x', this.properties.x, v => (this.properties.x = v));
  this.addWidget('text', 'y', this.properties.y, v => (this.properties.y = v));
  this.addWidget('button', '\uD83D\uDCBE', null, () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    const ctx = canvas.getContext('2d');
    VoronoiNode.prototype.onDrawBackground.call(this, ctx);
    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'voronoi.png';
    a.click();
  }, { width: 30 });
}
VoronoiNode.title = 'Voronoi';
VoronoiNode.icon = '\uD83D\uDCCD';
VoronoiNode.prototype.onExecute = function() {
  let pts = this.getInputData(0);
  if (!pts) return;
  const xKey = this.properties.x;
  const yKey = this.properties.y;
  if (Array.isArray(pts)) {
    pts = pts.map(p =>
      Array.isArray(p)
        ? p
        : [p[xKey] ?? p.x, p[yKey] ?? p.y]
    );
  }
  this._pts = pts;
  this._colors = this.getInputData(1);
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, VoronoiNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
VoronoiNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const pts = this._pts;
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  const img = octx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const py = minY + ((h - y) / h) * ((maxY - minY) || 1);
    for (let x = 0; x < w; x++) {
      const px = minX + (x / w) * ((maxX - minX) || 1);
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const dx = px - pts[i][0];
        const dy = py - pts[i][1];
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; best = i; }
      }
      const rgb = hexToRgb(labelColor(this._colors && this._colors[best]));
      const idx = (y * w + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, 0, 0);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  for (let i = 0; i < pts.length; i++) {
    const x = ((pts[i][0] - minX) / ((maxX - minX) || 1)) * w;
    const y = h - ((pts[i][1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
registerNode('viz/voronoi', VoronoiNode);

function PersistenceDiagramNode() {
  this.addInput('points', 'array');
  this.addOutput('image', 'string');
  this.size = [200, 150];
  this.resizable = true;
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
}
PersistenceDiagramNode.title = 'Persistence Diagram';
PersistenceDiagramNode.icon = '\u26F0\uFE0F';
PersistenceDiagramNode.prototype.onExecute = async function() {
  const pts = this.getInputData(0);
  if (!pts || this._pending) return;
  let data = pts;
  if (typeof pts[0] === 'object' && !Array.isArray(pts[0])) {
    const keys = Object.keys(pts[0]).filter(k => typeof pts[0][k] === 'number');
    data = pts.map(p => keys.map(k => p[k]));
  }
  this._pending = true;
  try {
    const res = await fetch('http://localhost:8000/persistence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      let msg;
      try {
        const err = await res.json();
        msg = err && err.detail ? err.detail : JSON.stringify(err);
      } catch (e) {
        msg = res.statusText;
      }
      throw new Error(`persistence request failed: ${msg}`);
    }
    const dgms = await res.json();
    this._dgms = Array.isArray(dgms) ? dgms : null;
    if (this._dgms) {
      this.setDirtyCanvas(true, true);
      const img = captureNodeImage(this, PersistenceDiagramNode.prototype.onDrawBackground);
      this.setOutputData(0, img);
    }
  } catch (err) {
    console.error(err);
    this._dgms = null;
  } finally {
    this._pending = false;
  }
};
PersistenceDiagramNode.prototype.onDrawBackground = function(ctx) {
  if (!Array.isArray(this._dgms)) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const pts = this._dgms.flat ? this._dgms.flat() : [].concat(...this._dgms);
  const births = pts.map(p => p[0]);
  const deaths = pts.map(p => p[1]);
  const min = Math.min(...births, ...deaths);
  const max = Math.max(...births, ...deaths);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, 0);
  ctx.stroke();
  const colors = ['#1f77b4', '#d62728', '#2ca02c'];
  this._dgms.forEach((dgm, dim) => {
    ctx.fillStyle = colors[dim % colors.length];
    dgm.forEach(p => {
      const x = ((p[0] - min) / ((max - min) || 1)) * w;
      const y = h - ((p[1] - min) / ((max - min) || 1)) * h;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
};
registerNode('viz/persistence', PersistenceDiagramNode);

function VietorisRipsNode() {
  this.addInput('points', 'array');
  this.addOutput('image', 'string');
  this.addProperty('epsilon', 1.0);
  this.size = [200, 150];
  this.resizable = true;
  this._zoom = 1;
  this._offset = [0, 0];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
  this.addWidget('slider', 'eps', this.properties.epsilon, v => (this.properties.epsilon = v), { min: 0.1, max: 5, step: 0.1 });
}
VietorisRipsNode.title = 'Vietoris-Rips';
VietorisRipsNode.icon = '\uD83D\uDD77\uFE0F';
VietorisRipsNode.prototype.onExecute = async function() {
  const pts = this.getInputData(0);
  if (!pts || this._pending) return;
  let data = pts;
  if (typeof pts[0] === 'object' && !Array.isArray(pts[0])) {
    const keys = Object.keys(pts[0]).filter(k => typeof pts[0][k] === 'number');
    data = pts.map(p => keys.map(k => p[k]));
  }
  this._pts = data;
  this._pending = true;
  try {
    const res = await fetch('http://localhost:8000/vietoris_rips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, params: { epsilon: this.properties.epsilon } }),
    });
    if (!res.ok) {
      let msg;
      try {
        const err = await res.json();
        msg = err && err.detail ? err.detail : JSON.stringify(err);
      } catch (e) {
        msg = res.statusText;
      }
      throw new Error(`vietoris_rips request failed: ${msg}`);
    }
    const edges = await res.json();
    this._edges = Array.isArray(edges) ? edges : [];
    this.setDirtyCanvas(true, true);
    const img = captureNodeImage(this, VietorisRipsNode.prototype.onDrawBackground);
    this.setOutputData(0, img);
  } catch (err) {
    console.error(err);
    this._edges = [];
  } finally {
    this._pending = false;
  }
};
VietorisRipsNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  const pts = this._pts;
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  drawPlotArea(ctx, w, h);
  ctx.strokeStyle = '#999';
  (Array.isArray(this._edges) ? this._edges : []).forEach(e => {
    const a = pts[e[0]];
    const b = pts[e[1]];
    const x1 = ((a[0] - minX) / ((maxX - minX) || 1)) * w;
    const y1 = h - ((a[1] - minY) / ((maxY - minY) || 1)) * h;
    const x2 = ((b[0] - minX) / ((maxX - minX) || 1)) * w;
    const y2 = h - ((b[1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  ctx.fillStyle = '#000';
  pts.forEach(p => {
    const x = ((p[0] - minX) / ((maxX - minX) || 1)) * w;
    const y = h - ((p[1] - minY) / ((maxY - minY) || 1)) * h;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};
registerNode('viz/vietoris_rips', VietorisRipsNode);
