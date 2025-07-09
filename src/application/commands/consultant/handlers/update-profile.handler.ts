import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { Consultant } from "domain/consultant/consultant.entity";
import { ObjectId } from "mongodb";
import { ConsultantProfileUpdatedEvent } from "application/events/consultant/consultant-profile-updated.event";
import { ConsultantProfileCreatedEvent } from "domain/events/consultant/consultant-profile-created.event";
import { UpdateConsultantProfileCommand } from "../update-profile.command";

@CommandHandler(UpdateConsultantProfileCommand)
export class CreateOrUpdateConsultantHandler
  implements ICommandHandler<UpdateConsultantProfileCommand>
{
  private readonly logger = new Logger(CreateOrUpdateConsultantHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository
  ) {}

  async execute(command: UpdateConsultantProfileCommand): Promise<Consultant> {
    const { profile } = command;
    let consultant: Consultant | null = null;
    try {
      const existingConsultant = profile.id
        ? await this.consultantRepository.findById(profile.id)
        : null;

      if (existingConsultant) {
        existingConsultant.updateProfile({
          ...profile,
          updatedAt: new Date(),
          userId: new ObjectId(profile.userId),
          profession: new ObjectId(profile.profession),
        });
        await this.consultantRepository.save(existingConsultant);
        existingConsultant.apply(
          new ConsultantProfileUpdatedEvent(existingConsultant.id, {
            userId: existingConsultant.userId.toString(),
            isAvailable: profile.isAvailable,
            profession: profile.profession,
            skills: profile.skills,
            business: profile.business,
            about: profile.about,
          })
        );
        consultant = existingConsultant;
        this.logger.log(
          `Consultant profile updated successfully: ${existingConsultant.id}`
        );
      } else {
        const newConsultant = new Consultant({
          ...profile,
          userId: new ObjectId(profile.userId),
          profession: new ObjectId(profile.profession),
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await this.consultantRepository.save(newConsultant);
        newConsultant.apply(
          new ConsultantProfileCreatedEvent(
            newConsultant.id,
            new ObjectId(newConsultant.userId),
            JSON.stringify({
              isAvailable: profile.isAvailable,
              profession: profile.profession,
              skills: profile.skills,
              business: profile.business,
              about: profile.about,
            })
          )
        );
        consultant = newConsultant;
        this.logger.log(
          `Consultant profile created successfully: ${newConsultant.id}`
        );
      }

      return consultant;
    } catch (error) {
      this.logger.error(
        `Error processing consultant profile: ${error.message}`
      );
      throw error; // Rethrow to propagate the error and let NestJS handle it
    }
  }
}
