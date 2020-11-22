import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { map, tap } from 'rxjs/operators';
import { omit } from 'ramda';
import { AppLogger } from '@/common/logger/app.logger';
import { __prod__ } from '@powerfulyang/utils';

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(CookieInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        this.logger.debug(`in ${CookieInterceptor.name}`);
      }),
      tap((data) => {
        if (data.cookie) {
          const ctx = context.switchToHttp();
          const response = ctx.getResponse<Response>();
          response.cookie(data.cookie[0], data.cookie[1], {
            httpOnly: true,
            sameSite: true,
            secure: __prod__ && true,
            domain: 'powerfulyang.com',
            expires: new Date('2100-01-01 00:00:00Z'),
          });
        }
      }),
      map((data) => omit(['cookie'])(data)),
    );
  }
}
