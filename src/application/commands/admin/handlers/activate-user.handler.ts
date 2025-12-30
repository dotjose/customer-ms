import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ActivateUserCommand } from "../admin.commands";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException } from "@nestjs/common";

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(command: ActivateUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.activate();
    await this.userRepository.save(user);
  }
}
