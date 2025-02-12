import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

import { ProfessionRepository } from "domain/consultant/profession.repositorty";
import { ProfessionDocument } from "infrastructure/persistence/mongodb/schemas/profession.schema";
import {
  Profession,
  ProfessionProps,
} from "domain/consultant/profession.entity";
import { ProfessionMapper } from "infrastructure/mappers/profession.mapper";

@Injectable()
export class MongoProfessionRepository implements ProfessionRepository {
  constructor(
    @InjectModel(ProfessionDocument.name)
    private readonly professionModel: Model<ProfessionDocument>
  ) {}

  /**
   * Retrieve a list of all professions from the database.
   *
   * @returns {Promise<ProfessionProps[]>} A promise that resolves to an array of ProfessionProps.
   */
  async listProfessions(): Promise<ProfessionProps[]> {
    const professions = await this.professionModel.find();
    return ProfessionMapper.toEntities(professions);
  }

  /**
   * Find a profession by its ID.
   *
   * @param {string} id - The ID of the profession to find.
   * @returns {Promise<Profession>} A promise that resolves to the found profession.
   * @throws {Error} If the ID is invalid or the profession is not found.
   */
  async findProfession(id: string): Promise<Profession> {
    if (!id) throw new Error("Invalid ID");

    const profession = await this.professionModel.findById(id);
    if (!profession) throw new Error(`Profession not found with id: ${id}`);

    return ProfessionMapper.toEntity(profession);
  }
}
export { ProfessionDocument };
