import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const AddMeta = createParamDecorator(
  (meta: Record<string, any>, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse();
    response.locals.meta = meta;
    return meta;
  }
);
