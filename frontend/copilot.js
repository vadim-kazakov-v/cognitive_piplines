document.addEventListener('DOMContentLoaded', () => {
  const copilot = document.getElementById('copilot');
  const showBtn = document.getElementById('copilot-show');
  const hideBtn = document.getElementById('copilot-hide');
  const sendBtn = document.getElementById('copilot-send');
  const qna = document.getElementById('copilot-qna');
  const output = document.getElementById('copilot-output');
  const modeSelect = document.getElementById('copilot-mode');

  hideBtn.addEventListener('click', () => {
    copilot.style.display = 'none';
    showBtn.style.display = 'block';
  });

  showBtn.addEventListener('click', () => {
    copilot.style.display = 'flex';
    showBtn.style.display = 'none';
  });

  sendBtn.addEventListener('click', () => {
    const question = qna.value.trim();
    if (!question) return;
    const mode = modeSelect.value;
    const payload = {
      question,
      model: window.globalConfig.modelName,
      mode
    };
    if (window.globalConfig.systemPrompt.trim()) {
      payload.system_prompt = window.globalConfig.systemPrompt.trim();
    }
    if (window.globalConfig.clientId && window.globalConfig.clientSecret) {
      payload.client_id = window.globalConfig.clientId;
      payload.client_secret = window.globalConfig.clientSecret;
    }
    if (mode !== 'generate') {
      payload.flow = graph.serialize ? graph.serialize() : {};
      payload.node_descriptions = collectNodeDescriptions();
    }
    if (mode === 'qna') {
      payload.images = collectNodeImages();
    }
    fetch('http://localhost:8000/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        qna.value = '';
        if ((mode === 'generate' || mode === 'modify') && data.answer) {
          try {
            const flow = JSON.parse(data.answer);
            if (window.graph && typeof graph.configure === 'function') {
              graph.configure(flow);
            }
            const pre = document.createElement('pre');
            pre.textContent = 'Flow updated';
            output.appendChild(pre);
          } catch (e) {
            const pre = document.createElement('pre');
            pre.textContent = 'Invalid flow JSON: ' + e.message;
            output.appendChild(pre);
          }
        } else {
          const pre = document.createElement('pre');
          pre.textContent = data.answer || JSON.stringify(data, null, 2);
          output.appendChild(pre);
        }
      })
      .catch(err => {
        const pre = document.createElement('pre');
        pre.textContent = 'Error: ' + err.message;
        output.appendChild(pre);
      });
  });
});

function collectNodeImages() {
  const images = [];
  if (window.graph && graph._nodes) {
    graph._nodes.forEach(n => {
      if (typeof n.getImage === 'function') {
        const img = n.getImage();
        if (img) images.push(img);
      } else if (n.image) {
        images.push(n.image);
      }
    });
  }
  return images;
}

const NODE_DESCRIPTIONS = {
  'Titanic Sample': 'Load example passenger records.',
  'CSV': 'Load data from a CSV file.',
  'Random Data': 'Generate a table of random numbers.',
  'Random Series': 'Generate a random time series.',
  'Sine Wave': 'Generate sine wave values.',
  'Describe Table': 'Summarize basic statistics for a table.',
  'Random Labels': 'Create random labels for classification tasks.',
  'Random Graph': 'Generate a random graph dataset.',
  'Select Field': 'Choose columns via dropdown or checkboxes.',
  'One-Hot Encode': 'Convert categorical values to one-hot vectors.',
  'Label Encode': 'Encode categorical labels as integers.',
  'Join DataFrames': 'Join two tables on a common key.',
  'To Number': 'Convert values to numbers.',
  'To String': 'Convert values to strings.',
  'To Boolean': 'Convert values to booleans.',
  'Rescale': 'Scale numeric ranges.',
  'Auto Numeric': 'Automatically parse numeric-like strings.',
  'Palette': 'Generate perceptually spaced colour palettes.',
  'Python': 'Execute custom Python code.',
  'Bias Report': 'Compute bias metrics for a dataset.',
  'Log': 'Print incoming data to the developer console.',
  'Status': 'Display a status message.',
  'Visualizer': 'Render nodes using the visualizer helper.',
  't-SNE': 'Run t-SNE dimensionality reduction.',
  'UMAP': 'Run UMAP dimensionality reduction.',
  'DBSCAN': 'Cluster data with DBSCAN.',
  'Spectral': 'Cluster data using spectral clustering.',
  'KMeans': 'Cluster data using K-means.',
  'GMM': 'Cluster data with Gaussian mixture models.',
  'PCA': 'Run principal component analysis.',
  'Isolation Forest': 'Detect anomalies with Isolation Forest.',
  'Local Outlier Factor': 'Detect anomalies with Local Outlier Factor.',
  'HyperDR': 'Hybrid dimensionality reduction using autoencoder or SOM.',
  'Random Forest': 'Train a random forest classifier.',
  'Explain Model': 'Explain predictions of a trained model.',
  'Bar Chart': 'Display a bar chart.',
  'Scatter2D': 'Show a 2D scatter plot.',
  'Scatter3D': 'Show a 3D scatter plot.',
  'Line Chart': 'Draw a line chart.',
  'Histogram': 'Plot a histogram.',
  'Heatmap': 'Render a heatmap.',
  'ImShow': 'Render 2D arrays as images with colormaps.',
  'Correlation Map': 'Visualize a correlation matrix.',
  'Table': 'Display tabular data.',
  'Lissajous': 'Visualize X/Y signals as Lissajous figures.',
  'Parallel Coords': 'Plot parallel coordinates for multidimensional data.',
  'Pie Chart': 'Render a pie chart.',
  'Sankey': 'Render a Sankey diagram.',
  'Violin': 'Display a violin plot.',
  'Graph': 'Show network graph structures.',
  'Glyphs': 'Render data-driven glyphs.',
  'Voronoi': 'Display Voronoi cells for point sets.',
  'Persistence Diagram': 'Topological data analysis persistence diagram.',
  'Persistence Barcode': 'Topological data analysis persistence barcode.',
  'Vietoris-Rips': 'Compute Vietoris-Rips complexes for point clouds.',
  'Uncertainty': 'Visualize model uncertainty.',
  'Contrast Focus': 'Dim unselected areas of an image while highlighting a rectangle.'
};

function collectNodeDescriptions() {
  const descriptions = [];
  if (window.graph && graph._nodes) {
    graph._nodes.forEach(n => {
      const title = n.title || n.type;
      const parts = [];
      if (NODE_DESCRIPTIONS[title]) {
        parts.push(`${title} - ${NODE_DESCRIPTIONS[title]}`);
      } else {
        parts.push(title);
      }
      const inputs = (n.inputs || [])
        .map(i => `${i.name}: ${i.type}`)
        .join(', ');
      const outputs = (n.outputs || [])
        .map(o => `${o.name}: ${o.type}`)
        .join(', ');
      parts.push(`Inputs: ${inputs || 'none'}`);
      parts.push(`Outputs: ${outputs || 'none'}`);
      descriptions.push(parts.join('. '));
    });
  }
  return descriptions;
}
