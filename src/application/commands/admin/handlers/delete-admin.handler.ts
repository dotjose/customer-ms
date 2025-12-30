import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteAdminCommand } from "../admin.commands";
import { AdminRepository } from "domain/admin/admin.repository";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";

@CommandHandler(DeleteAdminCommand)
export class DeleteAdminHandler implements ICommandHandler<DeleteAdminCommand> {
  constructor(
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(command: DeleteAdminCommand): Promise<void> {
    const { id } = command;

    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    if (!admin.canBeDeleted()) {
      throw new ForbiddenException("System users cannot be deleted");
    }

    await this.adminRepository.delete(id);
  }
}
