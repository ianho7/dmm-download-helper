// public/injected.js
// 这个文件会被直接复制到 dist，不经过 Vite 编译
// 必须是纯 JavaScript，不能用 TypeScript

(function () {
    'use strict';

    let sessions = [];
    let pendingMPD = null;
    let pendingKeys = null;
    let mpdTimer = null;
    let keysTimer = null;
    const MPD_DEBOUNCE_TIME = 300;  // 缩短到 300ms
    const KEYS_DEBOUNCE_TIME = 300; // Keys 也延迟 300ms
    const MAX_WAIT_TIME = 2000;     // 最长等待时间 2 秒

    // Performance API 优化
    let processedUrls = new Map();  // 改成 Map，存储 {url: timestamp}
    const PERFORMANCE_CLEAR_INTERVAL = 60000; // 每 60 秒清理一次 Performance Buffer
    const MAX_PROCESSED_URLS = 500; // 最多记录 500 个已处理 URL
    const URL_DEBOUNCE_TIME = 100; // 显著缩短 URL 去重时间，确保快速切换时也能触发

    // 日志控制
    const DEBUG_MODE = false; // 设置为 false 关闭详细日志
    const log = {
        debug: (...args) => DEBUG_MODE && console.log(...args),
        info: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    };

    log.info('[DMM Helper - Injected] Script initializing...');

    // --- 工具函数 ---
    const base64ToHex = (str) => {
        try {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const raw = atob(base64);
            return Array.from(raw).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toLowerCase();
        } catch (e) {
            log.error('[DMM Helper - Injected] base64ToHex error:', e);
            return "";
        }
    };

    const formatRawTo0x = (data) => {
        const buffer = new Uint8Array(data);
        let result = "[\n  ";
        for (let i = 0; i < buffer.length; i++) {
            result += "0x" + buffer[i].toString(16).padStart(2, '0') + ", ";
            if ((i + 1) % 16 === 0) result += "\n  ";
        }
        result += "\n]";
        return result;
    };

    const getTime = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });

    // 提取核心路径（用于判断是否为相同视频的 MPD）
    const getCoreUrl = (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url.split('?')[0];
        }
    };

    // --- 尝试配对 pending 的 MPD 和 Keys ---
    function tryMatchPending() {
        if (pendingMPD && pendingKeys) {
            log.info('[DMM Helper - Injected] 🎯 Matching pending MPD and Keys!');

            // 清除所有定时器
            clearTimeout(mpdTimer);
            clearTimeout(keysTimer);

            // 创建完整的 session
            createCompleteSession(pendingMPD, pendingKeys);

            // 清空 pending
            pendingMPD = null;
            pendingKeys = null;

            return true;
        }
        return false;
    }

    // --- 创建完整的 session ---
    function createCompleteSession(mpdData, keysData) {
        log.info('[DMM Helper - Injected] Creating complete session with MPD and Keys');

        sessions.unshift({
            id: sessions.length + 1,
            time: getTime(),
            timestamp: Date.now(), // 记录精确时间戳用于后期匹配
            mpd: mpdData.cleanUrl,
            fullMpd: mpdData.fullUrl,
            keys: keysData.parsedKeys,
            raw0x: keysData.raw0x
        });

        notifyUpdate();
    }

    // --- 核心逻辑：处理 MPD（延迟记录） ---
    function processMPD(url) {
        if (!url || typeof url !== 'string') return;

        if (url.includes('.mpd') || (url.includes('/dash/') && url.includes('manifest'))) {
            const now = Date.now();
            const lastProcessed = processedUrls.get(url);

            // 如果这个 URL 在 5 秒内处理过，跳过（避免 302 重定向重复处理）
            if (lastProcessed && (now - lastProcessed) < URL_DEBOUNCE_TIME) {
                log.debug('[DMM Helper - Injected] URL recently processed, skipping:', url);
                return;
            }

            log.info('[DMM Helper - Injected] 🎯 MPD detected:', url);

            // 更新处理时间戳
            processedUrls.set(url, now);

            // 限制 Map 大小，防止无限增长
            if (processedUrls.size > MAX_PROCESSED_URLS) {
                // 清理超过 10 秒的旧记录
                const entriesToKeep = Array.from(processedUrls.entries())
                    .filter(([_, timestamp]) => (now - timestamp) < 10000);
                processedUrls = new Map(entriesToKeep);
                log.debug('[DMM Helper - Injected] Cleaned up processed URLs cache');
            }

            const cleanUrl = url.split('?')[0];
            const coreUrl = getCoreUrl(url);

            // 1. 优先检查是否有 pending 的 Keys
            if (pendingKeys) {
                log.info('[DMM Helper - Injected] 🎯 MPD matching with pending Keys!');
                createCompleteSession({ cleanUrl, fullUrl: url, coreUrl }, pendingKeys);
                pendingKeys = null;
                if (keysTimer) {
                    clearTimeout(keysTimer);
                    keysTimer = null;
                }
                return;
            }

            // 2. 检查是否有最近的空的 session（只有 keys）正在等待 MPD
            let target = sessions.find(s => s.mpd === null && s.keys.length > 0 && (now - s.timestamp) < 10000);
            if (target) {
                log.info('[DMM Helper - Injected] Filling existing keys-only session with MPD');
                target.mpd = cleanUrl;
                target.fullMpd = url;
                target.timestamp = now; // 更新时间戳
                notifyUpdate();
                return;
            }

            // 3. 检查是否是当前正在抓取的 Session 的重复请求 (比如 302 或 manifest update 等)
            // 只匹配最顶层（最新）的一个，且 coreUrl 相同。如果是以前的质量等级切回来，它不应该是最新的。
            if (sessions.length > 0) {
                const latest = sessions[0];
                if (latest.mpd && getCoreUrl(latest.mpd) === coreUrl) {
                    log.debug('[DMM Helper - Injected] Updating latest session with redundant MPD request');
                    latest.mpd = cleanUrl;
                    latest.fullMpd = url;
                    // 注意：这里由于是同一个会话的更新，不更新 timestamp 以免干扰 key 匹配逻辑
                    notifyUpdate();
                    return;
                }
            }

            // 清除之前的定时器
            if (mpdTimer) {
                clearTimeout(mpdTimer);
                log.debug('[DMM Helper - Injected] Cleared previous MPD timer');
            }

            // 暂存当前 MPD
            pendingMPD = {
                cleanUrl: cleanUrl,
                fullUrl: url,
                coreUrl: coreUrl,
                timestamp: now
            };

            log.debug('[DMM Helper - Injected] MPD pending, checking for keys...');

            // 延迟记录
            mpdTimer = setTimeout(() => {
                if (!pendingMPD) return;

                log.info('[DMM Helper - Injected] ✅ MPD timeout, recording MPD');

                // 再次检查是否有空的 session（防止在等待期间产生）
                let target = sessions.find(s => s.mpd === null && s.keys.length > 0 && (Date.now() - s.timestamp) < 10000);

                if (target) {
                    log.debug('[DMM Helper - Injected] Filling existing keys-only session with MPD (late)');
                    target.mpd = pendingMPD.cleanUrl;
                    target.fullMpd = pendingMPD.fullUrl;
                } else {
                    log.debug('[DMM Helper - Injected] Creating MPD-only session (keys may come later)');
                    sessions.unshift({
                        id: sessions.length + 1,
                        time: getTime(),
                        timestamp: Date.now(),
                        mpd: pendingMPD.cleanUrl,
                        fullMpd: pendingMPD.fullUrl,
                        keys: [],
                        raw0x: null
                    });
                }

                pendingMPD = null;
                notifyUpdate();
            }, MPD_DEBOUNCE_TIME);
        }
    }

    // --- 核心逻辑：处理 Key（延迟记录） ---
    function processKey(data) {
        log.info('[DMM Helper - Injected] 🔑 Processing key data, size:', data.byteLength);

        try {
            const json = JSON.parse(new TextDecoder().decode(data));
            log.debug('[DMM Helper - Injected] Decoded JSON:', json);

            if (json.keys) {
                log.info('[DMM Helper - Injected] Keys detected, count:', json.keys.length);

                const parsedKeys = json.keys.map(kObj => ({
                    kid: base64ToHex(kObj.kid),
                    k: base64ToHex(kObj.k),
                    k32: base64ToHex(kObj.k).substring(0, 32)
                }));

                log.debug('[DMM Helper - Injected] Parsed keys:', parsedKeys);

                // 清除之前的定时器
                if (keysTimer) {
                    clearTimeout(keysTimer);
                    log.debug('[DMM Helper - Injected] Cleared previous Keys timer');
                }

                // 暂存当前 Keys
                pendingKeys = {
                    parsedKeys: parsedKeys,
                    raw0x: formatRawTo0x(data),
                    timestamp: Date.now()
                };

                // 尝试立即检查 Performance API 看看 MPD 是否已经在缓存中
                scanPerformance();

                // 尝试立即配对
                if (tryMatchPending()) {
                    return;
                }

                // 延迟记录
                keysTimer = setTimeout(() => {
                    if (!pendingKeys) return;

                    log.info('[DMM Helper - Injected] ✅ Keys timeout, recording Keys');

                    // 检查是否有空的 session（只有 mpd 且是最近的）
                    let target = sessions.find(s => s.keys.length === 0 && s.mpd !== null && (Date.now() - s.timestamp) < 10000);

                    if (target) {
                        log.debug('[DMM Helper - Injected] Filling existing MPD-only session with Keys');
                        target.keys = pendingKeys.parsedKeys;
                        target.raw0x = pendingKeys.raw0x;
                        target.timestamp = Date.now(); // 更新时间
                    } else {
                        log.debug('[DMM Helper - Injected] Creating Keys-only session (MPD may come later)');
                        sessions.unshift({
                            id: sessions.length + 1,
                            time: getTime(),
                            timestamp: Date.now(),
                            mpd: null,
                            fullMpd: null,
                            keys: pendingKeys.parsedKeys,
                            raw0x: pendingKeys.raw0x
                        });
                    }

                    pendingKeys = null;
                    notifyUpdate();
                }, KEYS_DEBOUNCE_TIME);
            } else {
                log.debug('[DMM Helper - Injected] No keys in JSON');
            }
        } catch (e) {
            log.debug('[DMM Helper - Injected] Failed to parse key data:', e);
        }
    }

    // --- 通知更新 ---
    function notifyUpdate() {
        const message = {
            type: 'DMM_UPDATE_SESSIONS',
            sessions: JSON.parse(JSON.stringify(sessions))
        };
        log.info('[DMM Helper - Injected] 📤 Posting message with', sessions.length, 'sessions');
        window.postMessage(message, '*');
    }

    // --- 安全阀：清理长时间未配对的 pending 数据 ---
    setInterval(() => {
        const now = Date.now();

        if (pendingMPD && (now - pendingMPD.timestamp) > MAX_WAIT_TIME) {
            log.warn('[DMM Helper - Injected] ⚠️ MPD waited too long, force recording');
            clearTimeout(mpdTimer);
            if (mpdTimer) mpdTimer = null;

            // 强制触发 MPD 记录
            setTimeout(() => {
                if (pendingMPD) {
                    processMPD(pendingMPD.fullUrl);
                }
            }, 0);
        }

        if (pendingKeys && (now - pendingKeys.timestamp) > MAX_WAIT_TIME) {
            log.warn('[DMM Helper - Injected] ⚠️ Keys waited too long, force recording');
            if (keysTimer) {
                clearTimeout(keysTimer);
                keysTimer = null;
            }

            // 强制创建 Keys-only session
            sessions.unshift({
                id: sessions.length + 1,
                time: getTime(),
                timestamp: Date.now(),
                mpd: null,
                fullMpd: null,
                keys: pendingKeys.parsedKeys,
                raw0x: pendingKeys.raw0x
            });
            pendingKeys = null;
            notifyUpdate();
        }
    }, 500);

    // --- 拦截器 ---
    log.info('[DMM Helper - Injected] Installing interceptors...');

    // 拦截 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        const urlString = url.toString();
        processMPD(urlString);
        return originalOpen.apply(this, arguments);
    };
    log.info('[DMM Helper - Injected] ✓ XMLHttpRequest interceptor installed');

    // 拦截 Fetch
    const originalFetch = window.fetch;
    window.fetch = async function () {
        const url = (typeof arguments[0] === 'string') ? arguments[0] : (arguments[0]?.url || "");
        processMPD(url);
        return originalFetch.apply(this, arguments);
    };
    log.info('[DMM Helper - Injected] ✓ Fetch interceptor installed');

    // 拦截 MediaKeySession
    const originalUpdate = MediaKeySession.prototype.update;
    MediaKeySession.prototype.update = function (data) {
        log.info('[DMM Helper - Injected] 🔑 MediaKeySession.update called');
        processKey(data);
        return originalUpdate.apply(this, arguments);
    };
    log.info('[DMM Helper - Injected] ✓ MediaKeySession interceptor installed');

    // --- 定期扫描 Performance API (优化版本) ---
    let lastPerformanceCheck = 0;

    function scanPerformance() {
        const entries = performance.getEntriesByType('resource');
        const newEntries = entries.slice(lastPerformanceCheck);

        // 只处理新的条目
        newEntries.forEach(entry => {
            if (entry.name.includes('.mpd')) {
                processMPD(entry.name);
            }
        });

        lastPerformanceCheck = entries.length;
    }

    setInterval(scanPerformance, 300); // 提高扫描频率到 300ms
    log.info('[DMM Helper - Injected] ✓ Performance monitor started');

    // --- 定期清理 Performance Buffer ---
    setInterval(() => {
        try {
            const resourceCount = performance.getEntriesByType('resource').length;

            if (resourceCount > 200) {
                log.info('[DMM Helper - Injected] Clearing Performance Buffer (', resourceCount, 'entries)');
                performance.clearResourceTimings();
                lastPerformanceCheck = 0;
            }
        } catch (e) {
            log.error('[DMM Helper - Injected] Error clearing Performance Buffer:', e);
        }
    }, PERFORMANCE_CLEAR_INTERVAL);
    log.info('[DMM Helper - Injected] ✓ Performance Buffer auto-clean enabled');

    log.info('[DMM Helper - Injected] ✅ All interceptors installed');
    log.info('[DMM Helper - Injected] Config: MPD debounce=' + MPD_DEBOUNCE_TIME + 'ms, Keys debounce=' + KEYS_DEBOUNCE_TIME + 'ms, Max wait=' + MAX_WAIT_TIME + 'ms');
    log.info('[DMM Helper - Injected] Debug mode:', DEBUG_MODE ? 'ON' : 'OFF');
})();