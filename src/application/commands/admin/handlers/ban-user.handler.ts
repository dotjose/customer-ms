import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BanUserCommand } from "../admin.commands";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException, BadRequestException } from "@nestjs/common";

@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(command: BanUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    try {
      user.ban();
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
