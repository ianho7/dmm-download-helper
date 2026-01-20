// src/content/injected.ts
// 这个脚本会被注入到页面上下文中，执行拦截逻辑

(function () {
  'use strict';

  let sessions: any[] = [];

  console.log('[DMM Helper - Injected] Script initializing...');

  // --- 工具函数 ---
  const base64ToHex = (str: string): string => {
    try {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(base64);
      return Array.from(raw).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toLowerCase();
    } catch (e) {
      console.error('[DMM Helper - Injected] base64ToHex error:', e);
      return "";
    }
  };

  const formatRawTo0x = (data: ArrayBuffer): string => {
    const buffer = new Uint8Array(data);
    let result = "[\n  ";
    for (let i = 0; i < buffer.length; i++) {
      result += "0x" + buffer[i].toString(16).padStart(2, '0') + ", ";
      if ((i + 1) % 16 === 0) result += "\n  ";
    }
    result += "\n]";
    return result;
  };

  const getTime = (): string => new Date().toLocaleTimeString('zh-CN', { hour12: false });

  // --- 核心逻辑：处理 MPD ---
  function processMPD(url: string) {
    if (!url || typeof url !== 'string') return;

    console.log('[DMM Helper - Injected] Checking URL:', url);

    if (url.includes('.mpd') || (url.includes('/dash/') && url.includes('manifest'))) {
      console.log('[DMM Helper - Injected] 🎯 MPD detected:', url);

      const cleanUrl = url.split('?')[0];
      if (sessions.some(s => s.mpd === cleanUrl)) {
        console.log('[DMM Helper - Injected] MPD already exists, skipping');
        return;
      }

      let target = sessions.find(s => s.mpd === null);
      if (target) {
        console.log('[DMM Helper - Injected] Updating existing session with MPD');
        target.mpd = cleanUrl;
        target.fullMpd = url;
      } else {
        console.log('[DMM Helper - Injected] Creating new session for MPD');
        sessions.unshift({
          id: sessions.length + 1,
          time: getTime(),
          mpd: cleanUrl,
          fullMpd: url,
          keys: [],
          raw0x: null
        });
      }
      notifyUpdate();
    }
  }

  // --- 核心逻辑：处理 Key ---
  function processKey(data: ArrayBuffer) {
    console.log('[DMM Helper - Injected] Processing key data, size:', data.byteLength);

    try {
      const json = JSON.parse(new TextDecoder().decode(data));
      console.log('[DMM Helper - Injected] Decoded JSON:', json);

      if (json.keys) {
        console.log('[DMM Helper - Injected] 🔑 Keys detected, count:', json.keys.length);

        const parsedKeys = json.keys.map((kObj: any) => ({
          kid: base64ToHex(kObj.kid),
          k: base64ToHex(kObj.k),
          k32: base64ToHex(kObj.k).substring(0, 32)
        }));

        console.log('[DMM Helper - Injected] Parsed keys:', parsedKeys);

        let target = sessions.find(s => s.keys.length === 0);
        if (target) {
          console.log('[DMM Helper - Injected] Updating existing session with keys');
          target.keys = parsedKeys;
          target.raw0x = formatRawTo0x(data);
        } else {
          console.log('[DMM Helper - Injected] Creating new session for keys');
          sessions.unshift({
            id: sessions.length + 1,
            time: getTime(),
            mpd: null,
            fullMpd: null,
            keys: parsedKeys,
            raw0x: formatRawTo0x(data)
          });
        }
        notifyUpdate();
      } else {
        console.log('[DMM Helper - Injected] No keys in JSON');
      }
    } catch (e) {
      console.log('[DMM Helper - Injected] Failed to parse key data:', e);
    }
  }

  // --- 通知更新 ---
  function notifyUpdate() {
    const message = {
      type: 'DMM_UPDATE_SESSIONS',
      sessions: JSON.parse(JSON.stringify(sessions))
    };
    console.log('[DMM Helper - Injected] 📤 Posting message with', sessions.length, 'sessions:', sessions);
    window.postMessage(message, '*');
  }

  // --- 拦截器 ---
  console.log('[DMM Helper - Injected] Installing interceptors...');

  // 拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    const urlString = url.toString();
    console.log('[DMM Helper - Injected] XHR:', method, urlString);

    if (urlString.includes('.mpd')) {
      console.log('[DMM Helper - Injected] 🎯 XHR .mpd detected:', urlString);
    }

    processMPD(urlString);
    return originalOpen.apply(this, arguments as any);
  };
  console.log('[DMM Helper - Injected] ✓ XMLHttpRequest interceptor installed');

  // 拦截 Fetch
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }

    console.log('[DMM Helper - Injected] Fetch:', url);

    if (url.includes('.mpd')) {
      console.log('[DMM Helper - Injected] 🎯 Fetch .mpd detected:', url);
    }

    processMPD(url);
    return originalFetch.call(this, input, init);
  };
  console.log('[DMM Helper - Injected] ✓ Fetch interceptor installed');

  // 拦截 MediaKeySession
  const originalUpdate = MediaKeySession.prototype.update;
  MediaKeySession.prototype.update = function (data: BufferSource) {
    console.log('[DMM Helper - Injected] 🔑 MediaKeySession.update called');
    processKey(data as ArrayBuffer);
    return originalUpdate.apply(this, arguments as any);
  };
  console.log('[DMM Helper - Injected] ✓ MediaKeySession interceptor installed');

  // --- 定期扫描 Performance API ---
  setInterval(() => {
    const entries = performance.getEntriesByType('resource');
    entries.forEach((entry: any) => {
      if (entry.name.includes('.mpd')) {
        console.log('[DMM Helper - Injected] 🎯 Performance API found .mpd:', entry.name);
        processMPD(entry.name);
      }
    });
  }, 1000);
  console.log('[DMM Helper - Injected] ✓ Performance monitor started');

  console.log('[DMM Helper - Injected] ✅ All interceptors installed successfully');
})();