type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private isProd = process.env.NODE_ENV === 'production';

    private format(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        if (this.isProd) {
            return JSON.stringify({
                timestamp,
                level: level.toUpperCase(),
                message,
                ...context,
            });
        }
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }

    info(message: string, context?: LogContext) {
        console.log(this.format('info', message, context));
    }

    warn(message: string, context?: LogContext) {
        console.warn(this.format('warn', message, context));
    }

    error(message: string, error?: any, context?: LogContext) {
        const errorDetails = error instanceof Error ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack,
        } : { error };

        console.error(this.format('error', message, { ...errorDetails, ...context }));
    }
}

export const logger = new Logger();
