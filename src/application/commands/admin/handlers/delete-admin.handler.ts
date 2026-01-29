import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";

import { UserRepository } from "domain/user/user.repository";
import { AdminRepository } from "domain/admin/admin.repository";
import { RedisService } from "infrastructure/services/redis.service";
import { UserSuspendedEvent } from "application/events/user/user-suspended.event";
import { DeleteAdminCommand } from "../admin.commands";

@CommandHandler(DeleteAdminCommand)
export class DeleteAdminHandler implements ICommandHandler<DeleteAdminCommand> {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    @Inject("AdminRepository")
    private readonly adminRepository: AdminRepository,
    private readonly redisService: RedisService,
    private readonly eventBus: EventBus
  ) { }

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
    await this.redisService.del('stats:user-mss:platform');
    this.eventBus.publish(new UserSuspendedEvent(user.id.toString(), user.firstName, user.email));
  }
}
