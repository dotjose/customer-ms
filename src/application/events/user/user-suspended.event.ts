import { IEvent } from "@nestjs/cqrs";

export class UserSuspendedEvent implements IEvent {
    constructor(
        public readonly userId: string,
        public readonly name: string,
        public readonly email: string
    ) { }
}
