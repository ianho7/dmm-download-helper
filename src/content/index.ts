// src/content/index.ts

import type { MessageData } from '../types';

console.log('[DMM Helper - Content] Content script started');
console.log('[DMM Helper - Content] Page URL:', window.location.href);

// 1. 注入脚本到页面上下文
function injectScript() {
  try {
    const script = document.createElement('script');
    const scriptUrl = chrome.runtime.getURL('injected.js');

    console.log('[DMM Helper - Content] Attempting to inject script from:', scriptUrl);

    script.src = scriptUrl;
    script.onload = () => {
      console.log('[DMM Helper - Content] ✅ Injected script loaded successfully');
      script.remove();
    };
    script.onerror = (error) => {
      console.error('[DMM Helper - Content] ❌ Failed to load injected script:', error);
      console.error('[DMM Helper - Content] Script URL was:', scriptUrl);
    };

    (document.head || document.documentElement).appendChild(script);
    console.log('[DMM Helper - Content] Script element appended to DOM');
  } catch (error) {
    console.error('[DMM Helper - Content] Error injecting script:', error);
  }
}

// 立即注入，不等待 DOMContentLoaded
injectScript();

// 2. 监听来自页面的消息
window.addEventListener('message', (event) => {
  // 只处理来自同源的消息
  if (event.source !== window) return;

  const data = event.data as MessageData;

  if (data.type === 'DMM_UPDATE_SESSIONS') {
    console.log('[DMM Helper - Content] 📨 Received sessions update:', data.sessions.length, 'sessions');
    console.log('[DMM Helper - Content] Sessions data:', data.sessions);

    // 转发到 background
    chrome.runtime.sendMessage(data)
      .then(() => {
        console.log('[DMM Helper - Content] ✅ Message sent to background successfully');
      })
      .catch(err => {
        console.error('[DMM Helper - Content] ❌ Failed to send message to background:', err);
      });
  }
});

console.log('[DMM Helper - Content] Message listener registered');
console.log('[DMM Helper - Content] Waiting for video player...');