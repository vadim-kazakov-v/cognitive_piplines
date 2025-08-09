function ApiNode(endpoint, title, params) {
  this.endpoint = endpoint;
  this.addInput('data', 'array');
  this.addOutput('result', 'array');
  this.title = title;
  this.properties = {};
  if (params) {
    for (const key in params) {
      const opt = params[key];
      this.properties[key] = opt.value;
      this.addWidget('slider', key, opt.value, v => (this.properties[key] = v), opt);
    }
  }
}
ApiNode.prototype.onExecute = async function() {
  let data = this.getInputData(0);
  if (!data || this._pending) return;
  // ensure 2D array
  if (Array.isArray(data) && data.length) {
    if (typeof data[0] === 'number') {
      data = data.map(v => [v]);
    } else if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
      data = data.map(o => Object.values(o).filter(v => typeof v === 'number'));
    }
  }
  const payload = { data };
  if (this.properties && Object.keys(this.properties).length) {
    payload.params = this.properties;
  }
  this._pending = true;
  try {
    const res = await fetch(`http://localhost:8000/${this.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    this.setOutputData(0, out);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};

function TsneNode() {
  ApiNode.call(this, 'tsne', 't-SNE', { perplexity: { value: 30, min: 5, max: 50 } });
}
TsneNode.title = 't-SNE';
TsneNode.icon = '🌀';
TsneNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/tsne', TsneNode);

function UmapNode() {
  ApiNode.call(this, 'umap', 'UMAP', { n_neighbors: { value: 15, min: 2, max: 50 } });
}
UmapNode.title = 'UMAP';
UmapNode.icon = '🌐';
UmapNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/umap', UmapNode);

function DbscanNode() {
  ApiNode.call(this, 'dbscan', 'DBSCAN', {
    eps: { value: 0.5, min: 0.1, max: 5, step: 0.1 },
    min_samples: { value: 5, min: 1, max: 20, step: 1 },
  });
}
DbscanNode.title = 'DBSCAN';
DbscanNode.icon = '🌌';
DbscanNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/dbscan', DbscanNode);

