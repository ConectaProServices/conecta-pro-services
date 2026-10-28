// src/common/filters/domain-http-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { CatalogServiceNotFoundException } from '../exceptions/catalog-service-not-found.exception.js';
import { SchedulingTooSoonException } from '../exceptions/scheduling-too-soon.exception.js';
import { SchedulingConflictException } from '../exceptions/scheduling-conflict.exception.js';
import { SchedulingNotFoundException } from '../exceptions/scheduling-not-found-exception.js';
import { SchedulingAlreadyConfirmedException } from '../exceptions/scheduling-already-confirmed.exception.js';
import { ServiceNotAvailableException } from '../exceptions/service-not-available.exception.js';

const DOMAIN_EXCEPTION_STATUS = new Map<any, HttpStatus>([
  [CatalogServiceNotFoundException, HttpStatus.NOT_FOUND],
  [SchedulingNotFoundException, HttpStatus.NOT_FOUND],
  [ServiceNotAvailableException, HttpStatus.UNPROCESSABLE_ENTITY],
  [SchedulingTooSoonException, HttpStatus.UNPROCESSABLE_ENTITY],
  [SchedulingConflictException, HttpStatus.CONFLICT],
  [SchedulingAlreadyConfirmedException, HttpStatus.CONFLICT],
]);

@Catch()
export class DomainHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.resolveStatus(exception);

    if (status !== undefined) {
      const error = exception as Error;
      return response.status(status).json({
        statusCode: status,
        error: error.name,
        message: error.message,
      });
    }

    // Log para erros inesperados
    console.error('❌ [DomainHttpExceptionFilter] Erro não mapeado:', exception);

    const isDev = process.env.NODE_ENV !== 'production';
    const message = exception instanceof Error ? exception.message : 'Internal Server Error';

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: isDev ? message : 'Erro interno do servidor',
    });
  }

  private resolveStatus(exception: unknown): HttpStatus | undefined {
    for (const [exceptionClass, status] of DOMAIN_EXCEPTION_STATUS) {
      if (exception instanceof exceptionClass) {
        return status;
      }
    }
    return undefined;
  }
}