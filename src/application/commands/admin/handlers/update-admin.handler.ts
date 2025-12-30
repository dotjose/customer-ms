import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UpdateAdminCommand } from "../admin.commands";
import { AdminRepository } from "domain/admin/admin.repository";
import { Inject, NotFoundException } from "@nestjs/common";

@CommandHandler(UpdateAdminCommand)
export class UpdateAdminHandler implements ICommandHandler<UpdateAdminCommand> {
  constructor(
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(command: UpdateAdminCommand): Promise<void> {
    const { id, firstName, lastName, phoneNumber } = command;

    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    admin.updateProfile(firstName, lastName, phoneNumber);
    await this.adminRepository.save(admin);
  }
}
