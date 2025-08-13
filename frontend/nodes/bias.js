function BiasReportNode() {
  this.addInput('data', 'array');
  this.addOutput('report', 'object');
  this.size = [220, 150];
  this.color = '#222';
  this.bgcolor = '#444';
  this._anchoring = this.addWidget('text', 'Anchoring', '', null, { disabled: true });
  this._clutter = this.addWidget('text', 'Clutter', '', null, { disabled: true });
  this._scale = this.addWidget('text', 'Scale', '', null, { disabled: true });
}
BiasReportNode.title = 'Bias Report';
BiasReportNode.icon = '⚖️';
BiasReportNode.prototype.onExecute = async function() {
  const data = this.getInputData(0);
  if (!data || this._pending) return;
  this._pending = true;
  try {
    const res = await fetch('http://localhost:8000/bias-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    const out = await res.json();
    if (this._anchoring) this._anchoring.value = out.anchoring.message;
    if (this._clutter) this._clutter.value = out.clutter.message;
    if (this._scale) this._scale.value = out.scale.message;
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};
registerNode('analysis/bias_report', BiasReportNode);
