import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { GetAdminsQuery } from "../admin.queries";
import { AdminRepository } from "domain/admin/admin.repository";
import { Inject } from "@nestjs/common";

@QueryHandler(GetAdminsQuery)
export class GetAdminsHandler implements IQueryHandler<GetAdminsQuery> {
  constructor(
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(query: GetAdminsQuery) {
    return await this.adminRepository.findAll(query);
  }
}
