import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, Logger, NotFoundException } from "@nestjs/common";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { GetConsultantDetailQuery } from "../get-consultant-detail.query";

@QueryHandler(GetConsultantDetailQuery)
export class GetConsultantDetailHandler
  implements IQueryHandler<GetConsultantDetailQuery>
{
  private readonly logger = new Logger(GetConsultantDetailHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository
  ) {}

  async execute(query: GetConsultantDetailQuery) {
    console.log(query);
    const { id } = query;

    this.logger.log(`Executing GetConsultantDetailQuery`, { id });

    const start = Date.now();
    try {
      const consultant =
        await this.consultantRepository.getConsultantDetails(id);

      if (!consultant) {
        throw new NotFoundException("Consultant not found");
      }

      const duration = Date.now() - start;
      this.logger.log(`GetConsultantDetailQuery completed`, {
        id,
        duration,
      });

      return consultant;
    } catch (error) {
      this.logger.error(`GetConsultantDetailQuery failed`, { id, error });
      throw error;
    }
  }
}
