export class SubscribeNewsletterCommand {
  constructor(public readonly email: string) {}
}

export class UnsubscribeNewsletterCommand {
  constructor(public readonly email: string) {}
}

export class UpdateNewsletterPreferencesCommand {
  constructor(
    public readonly email: string,
    public readonly preferences: {
      products?: boolean;
      jobs?: boolean;
      professionals?: boolean;
      events?: boolean;
      realestate?: boolean;
    }
  ) {}
}
