declare global {
  interface Window {
    __DEBUG_MODE__?: DebugState;
    toggleDebugCursor?: () => void;
    toggleDebugLogging?: () => void;
  }

  interface DebugState {
    showCursor: boolean;
    logging: boolean;
  }
}
