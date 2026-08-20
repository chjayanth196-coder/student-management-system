import { Injectable, Logger, Scope } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  userId?: string;
  institutionId?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  metadata?: Record<string, any>;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private readonly logger = new Logger('ERP');

  log(level: string, message: string, context?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    const logStr = JSON.stringify(entry);

    switch (level) {
      case 'error':
        this.logger.error(logStr);
        break;
      case 'warn':
        this.logger.warn(logStr);
        break;
      case 'debug':
        this.logger.debug(logStr);
        break;
      default:
        this.logger.log(logStr);
    }
  }

  info(message: string, context?: Partial<LogEntry>) {
    this.log('info', message, context);
  }

  error(message: string, error?: any, context?: Partial<LogEntry>) {
    this.log('error', message, { ...context, error });
  }

  warn(message: string, context?: Partial<LogEntry>) {
    this.log('warn', message, context);
  }

  debug(message: string, context?: Partial<LogEntry>) {
    this.log('debug', message, context);
  }

  audit(action: string, userId: string, entity: string, entityId?: string, metadata?: Record<string, any>) {
    this.log('audit', `AUDIT: ${action} on ${entity}${entityId ? ` [${entityId}]` : ''}`, {
      metadata: { action, userId, entity, entityId, ...metadata },
    });
  }
}
