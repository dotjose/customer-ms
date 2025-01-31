import { ICommand } from "@nestjs/cqrs";
import { UpdateUserDto } from "presentation/dtos/auth.dto";

export class UpdateUserCommand implements ICommand {
  constructor(public readonly profile: UpdateUserDto) {}
}
