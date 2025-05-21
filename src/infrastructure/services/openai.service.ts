import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Review } from "../../domain/consultant/consultant.entity";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { LocationDto } from "presentation/dtos/auth.dto";

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("Missing OpenAI API key");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  setApiKey(apiKey: string) {
    if (!apiKey) {
      throw new InternalServerErrorException("Invalid OpenAI API key");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.openai.models.list(); // A simple API call to check connectivity
      return true;
    } catch (error) {
      throw new InternalServerErrorException(
        "OpenAI connection failed",
        error.message
      );
    }
  }

  async generateConsultantReview(reviews: Review[]) {
    const prompt = this.buildReviewPrompt(reviews);

    const response = await this.openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return this.parseAIResponse(response.choices[0].message.content);
  }

  private buildReviewPrompt(reviews: Review[]): string {
    const reviewTexts = reviews
      .map((r) => `Rating: ${r.rating}/5\nReview: ${r.review}`)
      .join("\n\n");

    return `Analyze the following consultant reviews and provide a comprehensive summary:

${reviewTexts}

Please provide:
1. An overall rating (1-5)
2. A summary of strengths
3. A summary of weaknesses
4. Specific recommendations for improvement
Format as JSON.`;
  }

  private parseAIResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        rating: parsed.rating,
        summary: parsed.summary,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        recommendations: parsed.recommendations,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error("Failed to parse AI response");
    }
  }

  async rankConsultants(
    consultants: ConsultantWithUserDetails[],
    context: { profession: string; location: LocationDto; sortBy: string }
  ): Promise<any[]> {
    const { profession, location, sortBy } = context;

    const prompt = `
    You are an AI that helps rank consultants (mostly maids and handy persons) for a user. 
    Prioritize consultants based on the following factors:
    - Proximity to the user's location: ${location.address}, latitude:${
      location.coordinates[1]
    }, longitude: ${location.coordinates[0]}
    - Match with the user's profession: ${profession} (e.g., maid, handy person, cleaner)
    - Rating: Highest rating
    - Sort by: ${sortBy}

    Here is the list of consultants:
    ${JSON.stringify(
      consultants.map((c) => ({
        id: c.consultant.id,
        name: c.user.fullName,
        distance: c.user.location,
        averageRating: c.consultant.averageRating,
        skills: c.consultant.skills,
        hourlyRate: c.consultant.hourlyRate,
        experience: c.consultant.skills,
      }))
    )}

    Return the consultants in a sorted list, prioritizing the most relevant ones.
  `;

    const aiResponse = await this.callOpenAI(prompt);

    return aiResponse; // Assume the AI returns a sorted array
  }

  private async callOpenAI(prompt: string): Promise<any[]> {
    const response = await this.openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });
    return JSON.parse(response.choices[0].message.content);
  }
}
