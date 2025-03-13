import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, Logger, NotFoundException } from "@nestjs/common";
import { GetUserQuery } from "../get-user.query";
import { UserRepository } from "domain/user/user.repository";
import { ConsultantRepository } from "domain/consultant/consultant.repository";

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  private readonly logger = new Logger(GetUserHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    @Inject("UserRepository")
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetUserQuery) {
    const { id } = query;

    this.logger.log(`Executing GetUserDetailsQuery`, { id });

    const start = Date.now();
    try {
      const user = await this.userRepository.findById(id);
      const consultant = await this.consultantRepository.findByUserId(id);

      if (!user) {
        throw new NotFoundException("User not found");
      }

      const duration = Date.now() - start;
      this.logger.log(`GetUserDetailsQuery completed`, {
        id,
        duration,
        resultSummary: {
          hasConsultant: !!consultant,
        },
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        location: user.location,
        social: user.socials,
        bio: user.bio,
        consultantDetails: consultant,
      };
    } catch (error) {
      this.logger.error(`GetUserDetailsQuery failed`, { id, error });
      throw error;
    }
  }
}
