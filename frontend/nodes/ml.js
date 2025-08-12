function ApiNode(endpoint, title, params, outputs) {
  this.endpoint = endpoint;
  this.addInput('data', 'array');
  this.outputs = [];
  const outs = outputs && outputs.length ? outputs : ['result'];
  outs.forEach(name => this.addOutput(name, 'array'));
  this.title = title;
  this.properties = {};
   this.color = '#222';
   this.bgcolor = '#444';
  this._paramOpts = params || {};
  if (params) {
    for (const key in params) {
      const opt = params[key];
      const type = opt.type || 'slider';
      // ensure integer-only slider params are displayed and stored as integers
      if (
        type === 'slider' &&
        (opt.step === undefined || opt.step === 1 || opt.step === 1.0) &&
        opt.precision === undefined
      ) {
        opt.precision = 0;
      }
      this.properties[key] = opt.value;
      this.addWidget(
        type,
        key,
        opt.value,
        v => {
          if (
            type === 'slider' &&
            (opt.step === undefined || opt.step === 1 || opt.step === 1.0)
          ) {
            v = Math.round(v);
          }
          this.properties[key] = v;
          return v;
        },
        opt,
      );
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
      const type = (opt && opt.type) || 'slider';
      if (
        type === 'slider' &&
        (!opt || opt.step === undefined || opt.step === 1 || opt.step === 1.0)
      ) {
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
    if (this.outputs.length === 1) {
      this.setOutputData(0, out);
    } else {
      this.outputs.forEach((o, i) => this.setOutputData(i, out[o.name]));
    }
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
    n_components: { value: 2, min: 1, max: 50, step: 1 },
    min_dist: { value: 0.1, min: 0, max: 1, step: 0.01 },
    metric: {
      value: 'euclidean',
      type: 'combo',
      values: [
        'euclidean',
        'manhattan',
        'chebyshev',
        'minkowski',
        'canberra',
        'braycurtis',
        'haversine',
        'mahalanobis',
        'wminkowski',
        'seuclidean',
        'cosine',
        'correlation',
        'hamming',
        'jaccard',
        'dice',
        'russellrao',
        'kulsinski',
        'rogerstanimoto',
        'sokalmichener',
        'sokalsneath',
        'yule',
      ],
    },
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

function SpectralNode() {
  ApiNode.call(this, 'spectral', 'Spectral', {
    n_clusters: { value: 8, min: 1, max: 50, step: 1 },
  });
}
SpectralNode.title = 'Spectral';
SpectralNode.icon = '🔮';
SpectralNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/spectral', SpectralNode);

function KmeansNode() {
  ApiNode.call(this, 'kmeans', 'KMeans', {
    n_clusters: { value: 8, min: 1, max: 50, step: 1 },
    n_init: { value: 10, min: 1, max: 50, step: 1 },
  }, ['labels', 'centers']);
}
KmeansNode.title = 'KMeans';
KmeansNode.icon = '🎯';
KmeansNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/kmeans', KmeansNode);

function GmmNode() {
  ApiNode.call(this, 'gmm', 'GMM', {
    n_components: { value: 2, min: 1, max: 10, step: 1 },
  }, ['labels', 'means']);
}
GmmNode.title = 'GMM';
GmmNode.icon = '🍥';
GmmNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/gmm', GmmNode);

function PcaNode() {
  ApiNode.call(this, 'pca', 'PCA', {
    n_components: { value: 2, min: 1, max: 3, step: 1 },
  });
}
PcaNode.title = 'PCA';
PcaNode.icon = '🧮';
PcaNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/pca', PcaNode);

function IsolationForestNode() {
  ApiNode.call(this, 'isolation_forest', 'Isolation Forest', {
    n_estimators: { value: 100, min: 10, max: 300, step: 1 },
    contamination: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
  });
}
IsolationForestNode.title = 'Isolation Forest';
IsolationForestNode.icon = '🌲';
IsolationForestNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/isolation_forest', IsolationForestNode);

function LofNode() {
  ApiNode.call(this, 'lof', 'Local Outlier Factor', {
    n_neighbors: { value: 20, min: 1, max: 50, step: 1 },
  });
}
LofNode.title = 'Local Outlier Factor';
LofNode.icon = '🚨';
LofNode.prototype = Object.create(ApiNode.prototype);
registerNode('ml/lof', LofNode);

