export class UpdatePasswordCommand {
  constructor(
    public readonly currentPassword: string,
    public readonly newPassword: string,
    public readonly userId: string
  ) {}
}
