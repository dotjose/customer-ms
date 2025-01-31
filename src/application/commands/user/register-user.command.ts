import { ICommand } from "@nestjs/cqrs";

export class RegisterUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phoneNumber: string
  ) {}
}
