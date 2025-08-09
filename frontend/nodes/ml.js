function ApiNode(endpoint, title) {
  this.endpoint = endpoint;
  this.addInput('data', 'array');
  this.addOutput('result', 'array');
  this.title = title;
}
ApiNode.prototype.onExecute = async function() {
  const data = this.getInputData(0);
  if (!data || this._pending) return;
  this._pending = true;
  try {
    const res = await fetch(`http://localhost:8000/${this.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const out = await res.json();
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};

function TsneNode() { ApiNode.call(this, 'tsne', 't-SNE'); }
TsneNode.title = 't-SNE';
TsneNode.icon = '🌀';
TsneNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/tsne', TsneNode);

function UmapNode() { ApiNode.call(this, 'umap', 'UMAP'); }
UmapNode.title = 'UMAP';
UmapNode.icon = '🌐';
UmapNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/umap', UmapNode);

function DbscanNode() {
  ApiNode.call(this, 'dbscan', 'DBSCAN');
}
DbscanNode.title = 'DBSCAN';
DbscanNode.icon = '🌌';
DbscanNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/dbscan', DbscanNode);

