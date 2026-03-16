export type NovaRole = "USER" | "ASSISTANT";

export type NovaContentType = "TEXT" | "AUDIO";

export interface NovaContentStartEvent {
  type: NovaContentType;
  role?: NovaRole;
  additionalModelFields?: string;
}

export interface NovaTextOutputEvent {
  role?: NovaRole;
  content?: string;
}

export interface NovaAudioOutputEvent {
  content?: string;
}

export interface NovaContentEndEvent {
  type: NovaContentType;
  stopReason?: string;
}

export interface NovaErrorEvent {
  message?: string;
  details?: string;
}

export interface NovaProfileContext {
  goals?: string[];
  preferredStyle?: "gentle" | "direct";
}
