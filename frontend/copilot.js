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
      token: window.globalConfig.gigachatToken,
      mode
    };
    if (window.globalConfig.systemPrompt.trim()) {
      payload.system_prompt = window.globalConfig.systemPrompt.trim();
    }
    if (mode !== 'generate') {
      payload.flow = graph.serialize ? graph.serialize() : {};
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
