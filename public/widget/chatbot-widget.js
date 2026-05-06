/**
 * Ragly Chatbot Widget
 * Embeddable chat widget for websites
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Helper to determine base URL from script tag
  function getBaseUrl() {
    if (window.RAGLY_API_URL) return window.RAGLY_API_URL;
    
    // Fallback: try to find the script tag that loaded this widget
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('/widget/chatbot-widget.js')) {
            try {
                const url = new URL(scripts[i].src);
                return url.origin;
            } catch(e) {}
        }
    }
    
    return window.location.origin;
  }

  // Configuration
  const CONFIG = {
    apiBaseUrl: getBaseUrl(),
    chatbotId: window.RAGLY_CHATBOT_ID || '',
    position: window.RAGLY_POSITION || 'bottom-right', // bottom-right, bottom-left
    theme: window.RAGLY_THEME || 'light', // light, dark, auto
    primaryColor: window.RAGLY_PRIMARY_COLOR || '#4F46E5',
    buttonSize: window.RAGLY_BUTTON_SIZE || '60px',
    borderRadius: window.RAGLY_BORDER_RADIUS || '16px',
    borderColor: window.RAGLY_BORDER_COLOR || 'transparent',
    borderWidth: window.RAGLY_BORDER_WIDTH || '0px',
    zIndex: window.RAGLY_Z_INDEX || '9999',
  };

  // Validate chatbot ID
  if (!CONFIG.chatbotId) {
    console.error('Ragly Widget Error: RAGLY_CHATBOT_ID is required');
    return;
  }

  // State
  let isOpen = false;
  let messages = [];
  let isLoading = false;
  let sessionId = localStorage.getItem('ragly_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ragly_session_id', sessionId);
  }

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <!-- Ragly Chatbot Widget -->
      <div id="ragly-widget" style="
        position: fixed;
        ${CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        bottom: 20px;
        z-index: ${CONFIG.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ">
        <!-- Chat Button -->
        <button id="ragly-chat-button" style="
          width: ${CONFIG.buttonSize};
          height: ${CONFIG.buttonSize};
          border-radius: 50%;
          background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${adjustColor(CONFIG.primaryColor, -20)} 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)';" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';">
          <svg id="ragly-icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <svg id="ragly-icon-close" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <!-- Pulse effect -->
          <span style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${CONFIG.primaryColor};
            opacity: 0;
            animation: ragly-pulse 2s infinite;
          "></span>
        </button>

        <!-- Chat Window -->
        <div id="ragly-chat-window" style="
          position: absolute;
          ${CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          bottom: ${parseInt(CONFIG.buttonSize) + 10}px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - ${parseInt(CONFIG.buttonSize) + 50}px);
          background: white;
          border: ${CONFIG.borderWidth} solid ${CONFIG.borderColor};
          border-radius: ${CONFIG.borderRadius};
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          display: none;
          flex-direction: column;
          overflow: hidden;
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${adjustColor(CONFIG.primaryColor, -20)} 100%);
            padding: 20px;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <div style="
              width: 40px;
              height: 40px;
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 2a9 9 0 0 1 9 9v4a9 9 0 0 1-18 0v-4a9 9 0 0 1 9-9z"/>
                <path d="M8 14v2a4 4 0 0 0 8 0v-2"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div id="ragly-bot-name" style="font-weight: 600; font-size: 16px;">Chatbot</div>
              <div style="font-size: 12px; opacity: 0.9;">Online • Ready to help</div>
            </div>
            <button id="ragly-minimize-btn" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 8px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <!-- Messages Container -->
          <div id="ragly-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 12px;
          ">
            <!-- Messages will be inserted here -->
          </div>

          <!-- Input Area -->
          <div style="
            padding: 16px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            align-items: flex-end;
          ">
            <textarea id="ragly-input" placeholder="Type your message..." style="
              flex: 1;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px 16px;
              font-size: 14px;
              resize: none;
              max-height: 120px;
              font-family: inherit;
              outline: none;
              transition: border-color 0.2s;
            " rows="1" onfocus="this.style.borderColor='${CONFIG.primaryColor}'" 
               onblur="this.style.borderColor='#e5e7eb'"></textarea>
            <button id="ragly-send-btn" style="
              background: ${CONFIG.primaryColor};
              color: white;
              border: none;
              border-radius: 12px;
              width: 44px;
              height: 44px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              flex-shrink: 0;
            " onmouseover="this.style.background='${adjustColor(CONFIG.primaryColor, -10)}'; this.style.transform='scale(1.05)'" 
               onmouseout="this.style.background='${CONFIG.primaryColor}'; this.style.transform='scale(1)'">
              <svg id="ragly-send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <svg id="ragly-loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none; animation: ragly-spin 1s linear infinite;">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </button>
          </div>

          <!-- Powered by -->
          <div style="
            text-align: center;
            padding: 8px;
            font-size: 11px;
            color: #9ca3af;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          ">
            Powered by <a href="${CONFIG.apiBaseUrl}" target="_blank" style="color: ${CONFIG.primaryColor}; text-decoration: none; font-weight: 500;">Ragly</a>
          </div>
        </div>
      </div>

      <!-- Styles -->
      <style>
        @keyframes ragly-pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes ragly-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          #ragly-chat-window {
            position: fixed !important;
            left: 10px !important;
            right: 10px !important;
            bottom: 90px !important;
            top: 10px !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
          }
        }
      </style>
    `;

    // Insert widget into page
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Setup event listeners
    setupEventListeners();

    // Load chatbot info
    loadChatbotInfo();
  }

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Setup event listeners
  function setupEventListeners() {
    const chatButton = document.getElementById('ragly-chat-button');
    const chatWindow = document.getElementById('ragly-chat-window');
    const minimizeBtn = document.getElementById('ragly-minimize-btn');
    const sendBtn = document.getElementById('ragly-send-btn');
    const input = document.getElementById('ragly-input');
    const iconChat = document.getElementById('ragly-icon-chat');
    const iconClose = document.getElementById('ragly-icon-close');

    // Toggle chat window
    chatButton.addEventListener('click', toggleChat);
    minimizeBtn.addEventListener('click', toggleChat);

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('ragly-chat-window');
    const iconChat = document.getElementById('ragly-icon-chat');
    const iconClose = document.getElementById('ragly-icon-close');

    if (isOpen) {
      chatWindow.style.display = 'flex';
      setTimeout(() => {
        chatWindow.style.transform = 'scale(1)';
        chatWindow.style.opacity = '1';
      }, 10);
      iconChat.style.display = 'none';
      iconClose.style.display = 'block';
      
      // Add welcome message if first time
      if (messages.length === 0) {
        addBotMessage('Hello! How can I help you today? 😊');
      }
    } else {
      chatWindow.style.transform = 'scale(0.9)';
      chatWindow.style.opacity = '0';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);
      iconChat.style.display = 'block';
      iconClose.style.display = 'none';
    }
  }

  // Load chatbot info
  async function loadChatbotInfo() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/widget/chatbot/${CONFIG.chatbotId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.chatbot) {
          document.getElementById('ragly-bot-name').textContent = data.chatbot.name;
          if (data.chatbot.welcome_message && messages.length === 0 && isOpen) {
            addBotMessage(data.chatbot.welcome_message);
          }
        }
      }
    } catch (error) {
      console.error('Ragly Widget: Failed to load chatbot info', error);
    }
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById('ragly-input');
    const message = input.value.trim();

    if (!message || isLoading) return;

    // Add user message
    addUserMessage(message);
    input.value = '';
    input.style.height = 'auto';

    // Set loading state
    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/chatbots/${CONFIG.chatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.success && data.reply) {
        addBotMessage(data.reply);
      } else {
        addBotMessage('Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Ragly Widget: Error sending message', error);
      addBotMessage('Sorry, I couldn\'t process your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Add user message to chat
  function addUserMessage(text) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    messages.push({ type: 'user', text, timestamp });
    
    const messagesContainer = document.getElementById('ragly-messages');
    const messageEl = document.createElement('div');
    messageEl.style.cssText = 'display: flex; justify-content: flex-end; animation: ragly-fade-in 0.3s;';
    messageEl.innerHTML = `
      <div style="
        max-width: 80%;
        background: ${CONFIG.primaryColor};
        color: white;
        padding: 12px 16px;
        border-radius: 16px 16px 4px 16px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      ">
        ${escapeHtml(text)}
      </div>
    `;
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
  }

  // Add bot message to chat
  function addBotMessage(text) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    messages.push({ type: 'bot', text, timestamp });
    
    const messagesContainer = document.getElementById('ragly-messages');
    const messageEl = document.createElement('div');
    messageEl.style.cssText = 'display: flex; justify-content: flex-start; animation: ragly-fade-in 0.3s;';
    messageEl.innerHTML = `
      <div style="
        max-width: 80%;
        background: white;
        color: #1f2937;
        padding: 12px 16px;
        border-radius: 16px 16px 16px 4px;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        word-wrap: break-word;
        white-space: pre-wrap;
      ">
        ${escapeHtml(text)}
      </div>
    `;
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
  }

  // Set loading state
  function setLoading(loading) {
    isLoading = loading;
    const sendIcon = document.getElementById('ragly-send-icon');
    const loadingIcon = document.getElementById('ragly-loading-icon');
    const sendBtn = document.getElementById('ragly-send-btn');
    const input = document.getElementById('ragly-input');

    if (loading) {
      sendIcon.style.display = 'none';
      loadingIcon.style.display = 'block';
      sendBtn.style.opacity = '0.6';
      sendBtn.style.cursor = 'not-allowed';
      input.disabled = true;
    } else {
      sendIcon.style.display = 'block';
      loadingIcon.style.display = 'none';
      sendBtn.style.opacity = '1';
      sendBtn.style.cursor = 'pointer';
      input.disabled = false;
      input.focus();
    }
  }

  // Scroll to bottom
  function scrollToBottom() {
    const messagesContainer = document.getElementById('ragly-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ragly-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();
