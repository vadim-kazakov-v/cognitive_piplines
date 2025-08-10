function enableInteraction(node) {
  node._zoom = 1;
  node._offset = [0, 0];
  node.onMouseDown = function(e) {
    const header = LiteGraph.NODE_TITLE_HEIGHT;
    const widgets = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
    const limit = header + widgets;
    const localX = e.canvasX - this.pos[0];
    const localY = e.canvasY - this.pos[1];
    const inResizeCorner =
      localX > this.size[0] - 10 && localY > this.size[1] - 10;
    if (localY < limit || inResizeCorner) {
      // allow dragging the node itself from the title or widget area
      // or resizing from the bottom-right corner by letting LiteGraph handle the event
      return false;
    }
    this._dragging = true;
    this._last = [e.canvasX, e.canvasY];
    this.captureInput(true);
    return true;
  };
  node.onMouseMove = function(e) {
    if (this._dragging) {
      this._offset[0] += e.canvasX - this._last[0];
      this._offset[1] += e.canvasY - this._last[1];
      this._last = [e.canvasX, e.canvasY];
      this.setDirtyCanvas(true, true);
      return true;
    }
    return false;
  };
  node.onMouseUp = function() {
    this._dragging = false;
    this.captureInput(false);
    return false;
  };
  node.onMouseWheel = function(e) {
    const delta = e.wheelDeltaY ? e.wheelDeltaY : -e.deltaY;
    const scale = delta > 0 ? 1.1 : 0.9;
    const x = e.canvasX - this.pos[0] - this._offset[0];
    const y = e.canvasY - this.pos[1] - this._offset[1];
    this._offset[0] -= x * (scale - 1);
    this._offset[1] -= y * (scale - 1);
    this._zoom *= scale;
    this.setDirtyCanvas(true, true);
    return true;
  };
}

function disableNodeDrag(node) {
  node.onMouseDown = function(e) {
    const header = LiteGraph.NODE_TITLE_HEIGHT;
    const widgets = LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
    const limit = header + widgets;
    const localX = e.canvasX - this.pos[0];
    const localY = e.canvasY - this.pos[1];
    const inResizeCorner =
      localX > this.size[0] - 10 && localY > this.size[1] - 10;
    if (localY < limit || inResizeCorner) return false;
    this.captureInput(true);
    return true;
  };
  node.onMouseMove = () => false;
  node.onMouseUp = function() { this.captureInput(false); return false; };
  node.onMouseWheel = () => true;
}

function VisualizerNode() {
  this.addInput('image', 'string');
  this.size = [200, 150];
  this.color = '#222';
  this.bgcolor = '#444';
  enableInteraction(this);
}
VisualizerNode.title = 'Visualizer';
VisualizerNode.icon = '\uD83D\uDDBC\uFE0F';
VisualizerNode.prototype.onExecute = function() {
  const data = this.getInputData(0);
  if (!data) return;
  if (data !== this._current) {
    this._current = data;
    this._img = new Image();
    this._img.onload = () => this.setDirtyCanvas(true, true);
    this._img.src = data;
  }
};
VisualizerNode.prototype.onDrawBackground = function(ctx) {
  if (!this._img) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const w = this.size[0];
  const h = this.size[1] - top;
  ctx.save();
  ctx.translate(this._offset[0], this._offset[1] + top);
  ctx.scale(this._zoom, this._zoom);
  ctx.drawImage(this._img, 0, 0, w, h);
  ctx.restore();
};
registerNode('viz/view', VisualizerNode);
