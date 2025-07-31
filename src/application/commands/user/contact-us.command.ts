// contact-us.command.ts
export class ContactUsCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly subject: string,
    public readonly message: string
  ) {}
}
