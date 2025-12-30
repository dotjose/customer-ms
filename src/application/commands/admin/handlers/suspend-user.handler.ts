import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SuspendUserCommand } from "../admin.commands";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException, BadRequestException } from "@nestjs/common";

@CommandHandler(SuspendUserCommand)
export class SuspendUserHandler implements ICommandHandler<SuspendUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(command: SuspendUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    try {
      user.suspend();
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
