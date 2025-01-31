export class PasswordResetRequestedEvent {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly resetToken: string
  ) {}
}
