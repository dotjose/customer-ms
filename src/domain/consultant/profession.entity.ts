import { AggregateRoot } from "@nestjs/cqrs";

export interface ProfessionProps {
  name: string;
  description?: string;
  icon?: string;
}

// Profession-specific entity
export class Profession extends AggregateRoot {
  private readonly props: ProfessionProps;

  constructor(props: ProfessionProps) {
    super();
    this.props = props;
  }

  getProps(): ProfessionProps {
    return this.props;
  }
}
