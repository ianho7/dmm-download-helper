// src/types/index.ts

export interface DecryptionKey {
  kid: string;
  k: string;
  k32: string;
}

export interface Session {
  id: number;
  time: string;
  mpd: string | null;
  fullMpd: string | null;
  keys: DecryptionKey[];
  raw0x: string | null;
}

export interface MessageData {
  type: 'DMM_UPDATE_SESSIONS';
  sessions: Session[];
}