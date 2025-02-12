import { Profession, ProfessionProps } from "./profession.entity";

export interface ProfessionRepository {
  listProfessions(): Promise<ProfessionProps[]>;
  findProfession(name: string): Promise<Profession>;
}
