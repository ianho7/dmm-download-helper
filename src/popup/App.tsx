// src/popup/App.tsx

import React, { useState, useEffect } from 'react';
import type { Session } from '../types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const isCollapsed = false;

  useEffect(() => {
    console.log('[DMM Helper - Popup] Popup mounted');

    // 初始加载
    chrome.storage.session.get('sessions', (data: { sessions: Session[] }) => {
      console.log('[DMM Helper - Popup] Loaded sessions from storage:', data.sessions?.length || 0);
      setSessions(data.sessions || []);
    });

    // 监听实时更新
    const listener = (changes: any, area: string) => {
      if (area === 'session' && changes.sessions) {
        console.log('[DMM Helper - Popup] Sessions updated:', changes.sessions.newValue?.length || 0);
        setSessions(changes.sessions.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => {
      console.log('[DMM Helper - Popup] Popup unmounting');
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const copyToClipboard = async (text: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById(buttonId);
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = 'Copied';
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
        setTimeout(() => btn.innerText = originalText, 2500);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateNameByDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // const toggleCollapse = () => {
  //   setIsCollapsed(!isCollapsed);
  // };

  return (
    <div className={`container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="header">
        <div className={`title-box ${isCollapsed ? 'hidden' : ''}`}>
          <span className="title">DMM Download Helper</span>
          <span className="version">v1.0</span>
        </div>
        {/* <div className="header-actions">
          <button className="fold-btn" onClick={toggleCollapse}>
            {isCollapsed ? 'Unfold' : 'Fold'}
          </button>
        </div> */}
      </div>

      {!isCollapsed && (
        <div className="content">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>Waiting for DMM video player...</p>
              <p style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                Play a video on dmm.co.jp to capture data
              </p>
            </div>
          ) : (
            sessions.map((session, idx) => {
              const keyArgs = session.keys.map(k => `--key ${k.kid}:${k.k32}`).join(' ');
              const commandText = session.mpd && session.keys.length > 0
                ? `.\\N_m3u8DL-RE.exe ${session.fullMpd} ${keyArgs} --save-name ${generateNameByDate()} --decryption-engine SHAKA_PACKAGER`
                : '';

              return (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-badge">SESSION #{session.id}</div>
                    <div className="session-actions">
                      {commandText && (
                        <button
                          id={`copy-cmd-${idx}`}
                          className="copy-btn primary"
                          onClick={() => copyToClipboard(commandText, `copy-cmd-${idx}`)}
                        >
                          Copy N_m3u8DL-RE Command
                        </button>
                      )}
                      <span className="session-time">{session.time}</span>
                    </div>
                  </div>

                  {/* MPD Section */}
                  <div className="mpd-section">
                    <div className="section-title">🌐 MPD Manifest</div>
                    <div className="mpd-url">
                      {session.mpd || <span className="placeholder">Searching for manifest...</span>}
                    </div>
                    {session.mpd && (
                      <button
                        id={`copy-mpd-${idx}`}
                        className="copy-btn full-width"
                        onClick={() => copyToClipboard(session.fullMpd || '', `copy-mpd-${idx}`)}
                      >
                        Copy MPD Link
                      </button>
                    )}
                  </div>

                  {/* Keys Section */}
                  <div className="keys-section">
                    <div className="section-title green">🔑 ClearKey Update</div>
                    {session.keys.length > 0 ? (
                      <>
                        <div className="keys-list">
                          {session.keys.map((key, kidx) => (
                            <div key={kidx} className="key-unit">
                              <div className="unit-label">Unit #{kidx + 1}</div>
                              <div className="key-row">
                                <span className="key-label">KID:</span> {key.kid}
                              </div>
                              <div className="key-row">
                                <span className="key-label">KEY:</span> {key.k32}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="key-args">{keyArgs}</div>
                        <button
                          id={`copy-keys-${idx}`}
                          className="copy-btn full-width green"
                          onClick={() => copyToClipboard(keyArgs, `copy-keys-${idx}`)}
                        >
                          Copy All Keys
                        </button>
                        <details className="raw-details">
                          <summary>▶ View Raw Binary (0x)</summary>
                          <pre className="raw-content">{session.raw0x}</pre>
                        </details>
                      </>
                    ) : (
                      <div className="waiting-box">Waiting for License...</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default App;