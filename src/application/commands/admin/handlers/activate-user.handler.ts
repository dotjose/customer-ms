import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException } from "@nestjs/common";

import { RedisService } from "infrastructure/services/redis.service";
import { ActivateUserCommand } from "../admin.commands";

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService
  ) { }

  async execute(command: ActivateUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.activate();
    await this.userRepository.save(user);
    await this.redisService.del('stats:user-mss:platform');
  }
}
