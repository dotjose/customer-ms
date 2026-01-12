import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BlockUserCommand } from "../admin.commands";
import { UserRepository } from "domain/user/user.repository";
import { Inject, NotFoundException, BadRequestException } from "@nestjs/common";

import { RedisService } from "infrastructure/services/redis.service";

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<BlockUserCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(command: BlockUserCommand): Promise<void> {
    const { id } = command;
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("User not found");

    try {
      user.block();
      await this.userRepository.save(user);
      await this.redisService.del('stats:user-mss:platform');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
