import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log(
      '\n-----------------------------------------------------------',
    );

    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const start = Date.now();

    console.log(`Request : ${method} ${url}\n`, {
      timestamp: new Date().toISOString(),
      payload: body,
    });

    return next.handle().pipe(
      tap((response) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const end = Date.now();
        console.log(`Response : ${method} ${url}`, {
          timestamp: new Date().toISOString(),
          statusCode,
          duration: `${end - start}ms`,
          response: response ? JSON.stringify(response) : '',
        });

        console.log(
          '-----------------------------------------------------------\n',
        );
      }),
    );
  }
}
