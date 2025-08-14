window.globalConfig = {
  modelName: 'GigaChat-2-Max',
  systemPrompt: '',
  clientId: '',
  clientSecret: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const configBtn = document.getElementById('config-btn');
  const modal = document.getElementById('config-modal');
  const modelInput = document.getElementById('model-name');
  const promptInput = document.getElementById('system-prompt');
  const clientIdInput = document.getElementById('client-id');
  const clientSecretInput = document.getElementById('client-secret');

  configBtn.addEventListener('click', () => {
    modelInput.value = window.globalConfig.modelName;
    promptInput.value = window.globalConfig.systemPrompt;
    clientIdInput.value = window.globalConfig.clientId;
    clientSecretInput.value = window.globalConfig.clientSecret;
    modal.style.display = 'flex';
  });

  document.getElementById('close-config').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('save-config').addEventListener('click', () => {
    window.globalConfig.modelName = modelInput.value.trim() || 'GigaChat-2-Max';
    window.globalConfig.systemPrompt = promptInput.value.trim();
    window.globalConfig.clientId = clientIdInput.value.trim();
    window.globalConfig.clientSecret = clientSecretInput.value.trim();
    modal.style.display = 'none';
  });
});
