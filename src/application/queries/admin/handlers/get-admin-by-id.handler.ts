import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { GetAdminByIdQuery } from "../admin.queries";
import { AdminRepository } from "domain/admin/admin.repository";
import { Inject, NotFoundException } from "@nestjs/common";

@QueryHandler(GetAdminByIdQuery)
export class GetAdminByIdHandler implements IQueryHandler<GetAdminByIdQuery> {
  constructor(
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(query: GetAdminByIdQuery) {
    const admin = await this.adminRepository.findById(query.id);
    if (!admin) throw new NotFoundException("Admin not found");
    return admin;
  }
}
