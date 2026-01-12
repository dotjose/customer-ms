import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SuspendUserCommand } from "../admin.commands";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException, BadRequestException } from "@nestjs/common";

import { RedisService } from "infrastructure/services/redis.service";

@CommandHandler(SuspendUserCommand)
export class SuspendUserHandler implements ICommandHandler<SuspendUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(command: SuspendUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    try {
      user.suspend();
      await this.userRepository.save(user);
      await this.redisService.del('stats:user-mss:platform');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
