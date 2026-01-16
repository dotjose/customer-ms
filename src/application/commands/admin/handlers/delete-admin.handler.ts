import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserRepository } from "domain/user/user.repository";
import { AdminRepository } from "domain/admin/admin.repository";
import { DeleteAdminCommand } from "../admin.commands";

@CommandHandler(DeleteAdminCommand)
export class DeleteAdminHandler implements ICommandHandler<DeleteAdminCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(command: DeleteAdminCommand): Promise<void> {
    const { id } = command;

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.canBeDeleted()) {
      throw new ForbiddenException("System users cannot be deleted");
    }

    await this.adminRepository.delete(id);
  }
}
