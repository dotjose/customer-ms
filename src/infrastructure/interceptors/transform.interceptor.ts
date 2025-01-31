// src/common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { ApiResponse } from "application/shared/utils/api-response.util";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<any>> {
    const response = context.switchToHttp().getResponse();
    const meta = response.locals.meta || null;

    return next
      .handle()
      .pipe(
        map((data) => ApiResponse.success(data, "Operation successful", meta))
      );
  }
}
