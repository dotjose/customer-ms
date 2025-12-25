export class NewsletterPreferences {
  constructor(
    public readonly products: boolean = true,
    public readonly jobs: boolean = true,
    public readonly professionals: boolean = true,
    public readonly events: boolean = true,
    public readonly realestate: boolean = true,
    public readonly frequency: 'MONTHLY' = 'MONTHLY',
  ) {}

  static createDefault(): NewsletterPreferences {
    return new NewsletterPreferences();
  }
}
