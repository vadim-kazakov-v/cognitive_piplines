function ApiNode(endpoint, title, params) {
  this.endpoint = endpoint;
  this.addInput('data', 'array');
  this.addOutput('result', 'array');
  this.title = title;
  this.properties = {};
   this.color = '#222';
   this.bgcolor = '#444';
  this._paramOpts = params || {};
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
      const keys = [];
      data.forEach(o => {
        for (const k in o) {
          if (typeof o[k] === 'number' && !keys.includes(k)) keys.push(k);
        }
      });
      data = data.map(o => keys.map(k => (typeof o[k] === 'number' ? o[k] : 0)));
    }
  }
  const payload = { data };
  if (this.properties && Object.keys(this.properties).length) {
    payload.params = {};
    for (const k in this.properties) {
      let val = this.properties[k];
      const opt = this._paramOpts[k];
      if (!opt || opt.step === undefined || opt.step === 1 || opt.step === 1.0) {
        val = Math.round(val);
      }
      payload.params[k] = val;
    }
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
  ApiNode.call(this, 'umap', 'UMAP', {
    n_neighbors: { value: 15, min: 2, max: 50, step: 1 },
    n_components: { value: 2, min: 2, max: 3, step: 1 },
  });
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

