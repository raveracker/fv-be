import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const JwtProcessed = createParamDecorator(
  (data: any, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ...request.user,
    };
  },
);
