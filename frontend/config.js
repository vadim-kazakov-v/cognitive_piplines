window.globalConfig = {
  gigachatToken: '',
  modelName: 'GigaChat-2-Max',
  systemPrompt: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const configBtn = document.getElementById('config-btn');
  const modal = document.getElementById('config-modal');
  const tokenInput = document.getElementById('gigachat-token');
  const modelInput = document.getElementById('model-name');
  const promptInput = document.getElementById('system-prompt');

  configBtn.addEventListener('click', () => {
    tokenInput.value = window.globalConfig.gigachatToken;
    modelInput.value = window.globalConfig.modelName;
    promptInput.value = window.globalConfig.systemPrompt;
    modal.style.display = 'flex';
  });

  document.getElementById('close-config').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('save-config').addEventListener('click', () => {
    window.globalConfig.gigachatToken = tokenInput.value.trim();
    window.globalConfig.modelName = modelInput.value.trim() || 'GigaChat-2-Max';
    window.globalConfig.systemPrompt = promptInput.value.trim();
    modal.style.display = 'none';
  });
});
