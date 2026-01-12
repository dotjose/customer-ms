import { IQuery } from "@nestjs/cqrs";

export class GetUsersQuery implements IQuery {
  constructor(
    public readonly offset: number = 0,
    public readonly limit: number = 10,
    public readonly search?: string,
    public readonly status?: string,
    public readonly role?: string
  ) {}
}

export class GetUserByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

export class GetAdminsQuery implements IQuery {
  constructor(
    public readonly offset: number = 0,
    public readonly limit: number = 10,
    public readonly search?: string
  ) {}
}

export class GetAdminByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

export class SearchUserFeedbackQuery implements IQuery {
  constructor(
    public readonly offset: number = 0,
    public readonly limit: number = 10,
    public readonly search?: string,
    public readonly userId?: string
  ) {}
}

export * from "./get-platform-stats.query";
