import {
  Profession,
  ProfessionProps,
} from "domain/consultant/profession.entity";
import { ProfessionDocument } from "infrastructure/repositories/mongodb/profession.repository";

export class ProfessionMapper {
  static toProfessionProps(
    professionDocument: ProfessionDocument
  ): ProfessionProps {
    const { _id, ...rest } = professionDocument.toObject();
    return {
      ...rest,
      id: _id.toString(), // Map _id to id
    };
  }

  // Map a ProfessionDocument to a Profession entity
  static toEntity(professionDocument: ProfessionDocument): Profession {
    const professionProps = this.toProfessionProps(professionDocument);
    return new Profession(professionProps);
  }

  // Map an array of Professions to Profession entities
  static toEntities(
    professionDocuments: ProfessionDocument[]
  ): ProfessionProps[] {
    return professionDocuments.map((doc) => this.toProfessionProps(doc));
  }
}
