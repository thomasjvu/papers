/**
 * Logger utility for centralized logging with debug mode control
 *
 * This allows consistent logging across the application with the ability
 * to enable or disable debug logs based on the environment.
 */

// Check if debug mode is enabled
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * Logger class with different log levels
 */
class Logger {
  private prefix: string;

  /**
   * Create a new logger instance
   *
   * @param prefix - Module name or identifier to prepend to all logs
   */
  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  /**
   * Log a debug message (only shown when debug mode is enabled)
   *
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  debug(message: string, ...args: unknown[]): void {
    if (isDebugMode) {
      console.debug(`${this.prefix}${message}`, ...args);
    }
  }

  /**
   * Log an info message
   *
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix}${message}`, ...args);
  }

  /**
   * Log a warning message
   *
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix}${message}`, ...args);
  }

  /**
   * Log an error message
   *
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix}${message}`, ...args);
  }
}

/**
 * Create a new logger instance
 *
 * @param prefix - Module name or identifier to prepend to all logs
 * @returns A new logger instance
 */
export const createLogger = (prefix?: string): Logger => {
  return new Logger(prefix);
};

/**
 * Default logger instance
 */
export const logger = createLogger('App');

export default logger;
