function LogNode() {
  this.addInput('data', 'array');
  this.color = '#222';
  this.bgcolor = '#444';
}
LogNode.title = 'Log';
LogNode.icon = '📝';
LogNode.prototype.onExecute = function() {
  const d = this.getInputData(0);
  if (d) console.log(d);
};
registerNode('util/log', LogNode);

function StatusNode() {
  this.addInput('status', 'string');
  this.color = '#222';
  this.bgcolor = '#444';
}
StatusNode.title = 'Status';
StatusNode.icon = '🔌';
StatusNode.prototype.onExecute = function() {
  const s = this.getInputData(0);
  if (s === undefined) return;
  this._status = s;
  const top =
    LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  const lineH = 14;
  this.size[1] = top + lineH;
  this.setDirtyCanvas(true, true);
};
StatusNode.prototype.onDrawForeground = function(ctx) {
  if (this._status === undefined) return;
  const top =
    LiteGraph.NODE_TITLE_HEIGHT +
    LiteGraph.NODE_WIDGET_HEIGHT * (this.widgets ? this.widgets.length : 0);
  ctx.save();
  ctx.font = '12px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(String(this._status), 4, top + 14);
  ctx.restore();
};
registerNode('util/status', StatusNode);

let feedbackLog = [];

function recordSelection(path, timestamp) {
  feedbackLog.push({ id: null, data: { path, timestamp } });
  if (typeof updateFeedbackPanel === 'function') updateFeedbackPanel();
}

async function sendFeedback(text) {
  try {
    await fetch('http://localhost:8000/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    });
  } catch (err) {
    console.error(err);
  }
}

