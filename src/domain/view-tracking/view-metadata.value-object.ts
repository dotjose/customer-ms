/**
 * Value object for storing view metadata for future analytics
 * Currently lightweight, can be extended for time-based analytics
 */
export class ViewMetadata {
  constructor(
    public readonly hourlyBreakdown?: Map<string, number>, // ISO hour -> count
    public readonly dailyBreakdown?: Map<string, number>,  // ISO date -> count
    public readonly uniqueViewers?: Set<string>,           // For authenticated users
  ) {}

  static create(): ViewMetadata {
    return new ViewMetadata(
      new Map(),
      new Map(),
      new Set(),
    );
  }

  toObject() {
    return {
      hourlyBreakdown: this.hourlyBreakdown ? Object.fromEntries(this.hourlyBreakdown) : {},
      dailyBreakdown: this.dailyBreakdown ? Object.fromEntries(this.dailyBreakdown) : {},
      uniqueViewers: this.uniqueViewers ? Array.from(this.uniqueViewers) : [],
    };
  }
}
