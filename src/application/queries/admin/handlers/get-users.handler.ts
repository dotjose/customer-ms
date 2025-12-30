import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { GetUsersQuery } from "../admin.queries";
import { UserRepository } from "domain/user/user.repository";
import { Inject } from "@nestjs/common";

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetUsersQuery) {
    return await this.userRepository.findAll(query);
  }
}
