import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { GetUserByIdQuery } from "../admin.queries";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException } from "@nestjs/common";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetUserByIdQuery) {
    const user = await this.userRepository.findById(query.id);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}
