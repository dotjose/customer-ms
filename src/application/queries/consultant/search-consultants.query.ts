import { IQuery } from "@nestjs/cqrs";
import { SearchConsultantsDto } from "presentation/dtos/consultant.dto";

export class SearchConsultantsQuery implements IQuery {
  constructor(public readonly params: SearchConsultantsDto) {}
}

export class GetNearbyConsultantsQuery implements IQuery {
  constructor(public readonly params: SearchConsultantsDto) {}
}
