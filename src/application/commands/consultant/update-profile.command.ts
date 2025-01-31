import { ICommand } from "@nestjs/cqrs";
import { CreateConsultantProfileDto } from "../../../presentation/dtos/consultant.dto";

export class UpdateConsultantProfileCommand implements ICommand {
  constructor(public readonly profile: CreateConsultantProfileDto) {}
}
