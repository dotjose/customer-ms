import { ICommand } from "@nestjs/cqrs";

export class CreateAdminCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phoneNumber: string
  ) {}
}

export class UpdateAdminCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phoneNumber: string
  ) {}
}

export class DeleteAdminCommand implements ICommand {
  constructor(public readonly id: string) {}
}

export class BlockUserCommand implements ICommand {
  constructor(public readonly id: string) {}
}

export class SuspendUserCommand implements ICommand {
  constructor(public readonly id: string) {}
}

export class BanUserCommand implements ICommand {
  constructor(public readonly id: string) {}
}

export class ActivateUserCommand implements ICommand {
  constructor(public readonly id: string) {}
}
