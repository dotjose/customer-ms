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
    const apiURL = this.configService.get<string>("OPENAI_BASE_URL");

    if (!apiKey && !apiURL) {
      throw new InternalServerErrorException("Missing OpenAI API key");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  setApiKey(apiKey: string, baseURL: string) {
    if (!apiKey) {
      throw new InternalServerErrorException("Invalid OpenAI API key");
    }
    this.openai = new OpenAI({ apiKey, baseURL });
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
    const cleanReviews = this.filterReviews(reviews);
    if (cleanReviews.length < 3) {
      throw new Error("Not enough quality reviews to generate AI feedback.");
    }

    const prompt = this.buildReviewPrompt(reviews);

    // Your Groq API call
    const response = await this.openai.chat.completions.create({
      // --- MODEL UPGRADE ---
      // Upgraded to the more powerful 70B parameter model for higher quality analysis.
      model: "llama-3.3-70b-versatile",
      // ---------------------
      messages: [
        {
          role: "system",
          content:
            "You are an expert review analyst on a professional freelancer platform. Your goal is to generate a structured, high-quality AI summary to help freelancers understand their feedback and improve.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 800,
    });

    const rawResponse = response.choices[0].message.content;
    return this.parseAIResponse(rawResponse);
  }

  private filterReviews(reviews: Review[]): Review[] {
    const blockedWords = ["fuck", "shit", "idiot", "scam", "dumb"];
    const profanityRegex = new RegExp(blockedWords.join("|"), "i");

    return reviews.filter((r) => {
      if (!r.review || !r.rating) return false;
      const text = r.review.toLowerCase().trim();
      return text.length >= 10 && !profanityRegex.test(text);
    });
  }

  private buildReviewPrompt(reviews: Review[]): string {
    const reviewTexts = reviews
      .map(
        (r) =>
          `User: ${r.userName}\nRating: ${
            r.rating
          }/5\nComment: ${r.review.trim()}`
      )
      .join("\n\n---\n\n");

    return `
Analyze the following freelancer reviews thoroughly and provide a detailed, professional analysis.

### INSTRUCTIONS:
1. **Summary**: Write a concise 2-3 sentence summary capturing the overall sentiment and key themes.
2. **Strengths**: 
   - Extract 3-5 specific strengths mentioned across reviews
   - Be specific (e.g., "Excellent frontend development skills" instead of "Great work")
   - Include frequency if multiple clients mention the same strength
3. **Weaknesses**:
   - Identify 2-3 concrete areas for improvement mentioned in reviews
   - If no clear weaknesses exist, analyze patterns in lower-rated reviews for potential issues
   - Never make up weaknesses - use only what's evident from the comments
4. **Recommendations**:
   - Provide 2-3 actionable, specific suggestions tied directly to identified weaknesses
   - Include both short-term fixes and long-term improvement strategies
5. **Rating**: Calculate the precise average rating from all reviews (to 1 decimal place)

### ANALYSIS GUIDELINES:
- Focus on concrete skills and behaviors mentioned
- Differentiate between one-off comments and recurring patterns
- For negative comments without details, suggest generic improvement areas but mark them as [UNSPECIFIED]
- Maintain professional tone while being direct

### REVIEWS:
${reviewTexts}

### REQUIRED JSON OUTPUT FORMAT:
{
  "rating": number,
  "summary": "string",
  "strengths": ["string (specific skill/attribute)", ...],
  "weaknesses": ["string (specific area needing improvement)", ...],
  "recommendations": ["string (actionable suggestion)", ...]
}

Output only valid JSON with no additional commentary or formatting.
`;
  }

  private parseAIResponse(response: string) {
    try {
      const cleaned = response
        .trim()
        .replace(/^```json\s*/, "")
        .replace(/```$/, "");
      const parsed = JSON.parse(cleaned);

      if (
        typeof parsed.rating !== "number" ||
        typeof parsed.summary !== "string" ||
        !Array.isArray(parsed.strengths) ||
        !parsed.strengths.every((s: any) => typeof s === "string") ||
        !Array.isArray(parsed.weaknesses) ||
        !parsed.weaknesses.every((w: any) => typeof w === "string") ||
        !Array.isArray(parsed.recommendations) ||
        !parsed.recommendations.every((r: any) => typeof r === "string")
      ) {
        console.error(
          "AI response JSON schema mismatch. Parsed object:",
          parsed
        );
        throw new Error(
          "AI response JSON schema mismatch with the expected flat structure."
        );
      }

      return {
        rating: parsed.rating,
        summary: parsed.summary,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        recommendations: parsed.recommendations,
        lastUpdated: new Date(),
      };
    } catch (err) {
      console.error("❌ Failed to parse AI response:", response);
      throw new Error(`Failed to parse AI response: ${err.message}`);
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
