// src/background/index.ts

import type { MessageData } from '../types';

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message: MessageData) => {
  if (message.type === 'DMM_UPDATE_SESSIONS') {
    // 存储到 session storage
    chrome.storage.session.set({
      sessions: message.sessions
    }).catch(err => {
      console.error('[DMM Helper] Failed to store sessions:', err);
    });
  }

  // 更新Badge
  if (message.sessions.length <= 0) return;
  chrome.action.setBadgeText({
    text: message.sessions.length.toString()
  });

  // 设置徽章的背景颜色（例如红色）
  chrome.action.setBadgeBackgroundColor({ color: "#c10000" });

  // 设置徽章文字的颜色（部分系统支持）
  chrome.action.setBadgeTextColor({ color: "#FFFFFF" });
});

console.log('[DMM Helper] Background service worker loaded');