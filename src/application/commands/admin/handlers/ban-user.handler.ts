import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException, BadRequestException } from "@nestjs/common";

import { RedisService } from "infrastructure/services/redis.service";
import { UserSuspendedEvent } from "application/events/user/user-suspended.event";
import { BanUserCommand } from "../admin.commands";

@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly eventBus: EventBus
  ) { }

  async execute(command: BanUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    try {
      user.ban();
      await this.userRepository.save(user);
      await this.redisService.del('stats:user-mss:platform');
      this.eventBus.publish(new UserSuspendedEvent(user.id.toString(), user.firstName, user.email));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
