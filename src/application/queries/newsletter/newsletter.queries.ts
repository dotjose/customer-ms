export class GetSubscriberByTokenQuery {
  constructor(public readonly token: string) {}
}

export class GetSubscriberPreferencesQuery {
  constructor(public readonly email: string) {}
}
