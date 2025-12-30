import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateAdminCommand } from "../admin.commands";
import { Admin } from "domain/admin/admin.entity";
import { AdminRepository } from "domain/admin/admin.repository";
import { Inject, ConflictException } from "@nestjs/common";

@CommandHandler(CreateAdminCommand)
export class CreateAdminHandler implements ICommandHandler<CreateAdminCommand> {
  constructor(
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository
  ) {}

  async execute(command: CreateAdminCommand): Promise<void> {
    const { email, firstName, lastName, phoneNumber } = command;

    const existing = await this.adminRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("Admin with this email already exists");
    }

    const admin = new Admin({
      email,
      firstName,
      lastName,
      phoneNumber,
      role: "ADMIN",
      status: "ACTIVE" as any,
      isSystemUser: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.adminRepository.save(admin);
  }
}
