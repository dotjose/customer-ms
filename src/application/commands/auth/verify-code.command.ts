import { ICommand } from "@nestjs/cqrs";

export class VerifyCodeCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly phone: string,
    public readonly code: string
  ) {}
}
