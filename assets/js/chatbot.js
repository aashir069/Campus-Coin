(() => {
  'use strict';

  const root = document.getElementById('campusChat');
  if (!root) return;

  const launcher = root.querySelector('.chat-launcher');
  const panel = root.querySelector('.campus-chat-panel');
  const closeButton = root.querySelector('.chat-close');
  const form = root.querySelector('.chat-form');
  const input = root.querySelector('.chat-input');
  const sendButton = root.querySelector('.chat-send');
  const messages = root.querySelector('.chat-messages');
  const history = [];
  let busy = false;
  let typing = null;

  function openChat() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function formatAssistantMessage(text) {
    const div = document.createElement('div');
    div.textContent = text;
    let safe = div.innerHTML;
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    return safe;
  }

  function appendMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-message chat-message-${role}`;
    if (role === 'assistant') {
      bubble.innerHTML = formatAssistantMessage(text);
    } else {
      bubble.textContent = text;
    }
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'Campus Coin AI is thinking');
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    sendButton.disabled = value;
    sendButton.setAttribute('aria-label', value ? 'Waiting for Campus Coin AI' : 'Send message');
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || busy) return;

    appendMessage('user', text);
    input.value = '';
    setBusy(true);
    showTyping();

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
      const response = await fetch(root.dataset.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ message: text, history: history.slice(-8) })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true || typeof result.reply !== 'string') {
        throw new Error(typeof result.error === 'string' ? result.error : 'Sorry, the AI assistant is temporarily unavailable. Please try again later.');
      }
      typing.remove();
      typing = null;
      appendMessage('assistant', result.reply);
      history.push({ role: 'user', text }, { role: 'assistant', text: result.reply });
      if (history.length > 8) history.splice(0, history.length - 8);
    } catch (error) {
      if (typing) typing.remove();
      typing = null;
      appendMessage('assistant', error instanceof Error ? error.message : 'Sorry, the AI assistant is temporarily unavailable. Please try again later.');
    } finally {
      setBusy(false);
      if (!panel.hidden) input.focus();
    }
  }

  launcher.addEventListener('click', () => panel.hidden ? openChat() : closeChat());
  closeButton.addEventListener('click', closeChat);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closeChat();
  });
})();
