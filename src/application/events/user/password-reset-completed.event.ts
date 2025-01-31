export class PasswordResetCompletedEvent {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {}
}
