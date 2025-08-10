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

function Scatter3DNode() {
  this.addInput('points', 'array');
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
  if (this._img) this.setOutputData(0, this._img);
  this.setDirtyCanvas(true, true);
};
Scatter3DNode.prototype.onDrawBackground = function(ctx) {
  if (!this._pts) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  if (!this._glcanvas || this._glcanvas.width !== w || this._glcanvas.height !== h) {
    this._glcanvas = document.createElement('canvas');
    this._glcanvas.width = w;
    this._glcanvas.height = h;
    const gl = this._glcanvas.getContext('webgl', { preserveDrawingBuffer: true });
    this._gl = gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec3 aPos;void main(){gl_Position=vec4(aPos,1.0);gl_PointSize=4.0;}');
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision mediump float;void main(){gl_FragColor=vec4(0.48,0.82,1.0,1.0);}');
    gl.compileShader(fs);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    this._program = program;
    this._posLoc = gl.getAttribLocation(program, 'aPos');
    this._buffer = gl.createBuffer();
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
  const data = new Float32Array(pts.length * 3);
  const rx = this._rot[0], ry = this._rot[1], scale = this._zoom;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const px = Array.isArray(p) ? p[0] : p.x;
    const py = Array.isArray(p) ? p[1] : p.y;
    const pz = Array.isArray(p) ? p[2] : p.z;
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
    data[i * 3] = x2 / depth;
    data[i * 3 + 1] = y1 / depth;
    data[i * 3 + 2] = 0;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(this._posLoc);
  gl.vertexAttribPointer(this._posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, pts.length);
  this._img = this._glcanvas.toDataURL();
  ctx.save();
  ctx.translate(0, top);
  ctx.drawImage(this._glcanvas, 0, 0);
  ctx.restore();
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

function drawTableView(ctx, data, props, w, h, state) {
  const headerH = 18;
  const paginationH = 20;
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(0, 0, w, h);
  let rows = Array.isArray(data) ? data.slice() : [data];
  if (!rows.length) return;
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
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'search';
  input.style.position = 'absolute';
  input.style.zIndex = 10;
  input.addEventListener('input', () => {
    this.properties.search = input.value;
    this.properties.page = 0;
    this.setDirtyCanvas(true, true);
  });
  this._searchInput = input;
  const updatePos = () => {
    if (!this._searchInput) return;
    const rect = canvas.canvas.getBoundingClientRect();
    const [x, y] = canvas.convertOffsetToCanvas(this.pos);
    this._searchInput.style.left = `${rect.left + x + 4}px`;
    this._searchInput.style.top = `${rect.top + y + LiteGraph.NODE_TITLE_HEIGHT + 4}px`;
    this._searchInput.style.width = `${this.size[0] * canvas.ds.scale - 8}px`;
    this._searchInput.style.height = `${LiteGraph.NODE_WIDGET_HEIGHT - 4}px`;
    this._searchInput.style.fontSize = `${12 * canvas.ds.scale}px`;
  };
  this.onDrawForeground = function() {
    updatePos();
  };
  this.onAdded = function() {
    this._searchInput.value = this.properties.search;
    canvas.canvas.parentNode.appendChild(this._searchInput);
    updatePos();
  };
  this.onRemoved = function() {
    this._searchInput.remove();
    this._searchInput = null;
  };
  this.onMouseDown = function(e) {
    if (!this._tableState) return false;
    const header = LiteGraph.NODE_TITLE_HEIGHT;
    const widgetsH = LiteGraph.NODE_WIDGET_HEIGHT;
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
  this.setDirtyCanvas(true, true);
  const img = captureNodeImage(this, TableViewNode.prototype.onDrawBackground);
  this.setOutputData(0, img);
};
TableViewNode.prototype.onDrawBackground = function(ctx) {
  if (!this._data) return;
  const top = LiteGraph.NODE_WIDGET_HEIGHT + 4;
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(0, top);
  this._tableState = {};
  drawTableView(ctx, this._data, this.properties, w, h, this._tableState);
  ctx.restore();
};
registerNode('viz/table', TableViewNode);

