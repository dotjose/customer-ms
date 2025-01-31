import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
} from "@aws-sdk/client-sns";

@Injectable()
export class AWSConfigService {
  private readonly logger = new Logger(AWSConfigService.name);
  private readonly sesClient: SESClient;
  private readonly snsClient: SNSClient;

  constructor(private readonly configService: ConfigService) {
    const awsConfig = {
      region: this.configService.get<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get<string>(
          "AWS_SECRET_ACCESS_KEY"
        ),
      },
    };

    this.sesClient = new SESClient(awsConfig);
    this.snsClient = new SNSClient(awsConfig);
  }

  async sendEmail(params: SendEmailCommandInput): Promise<void> {
    try {
      this.logger.log(
        `Attempting to send email to: ${params.Destination?.ToAddresses?.join(", ")}`
      );
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      this.logger.log("Email sent successfully.");
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendSMS(params: PublishCommandInput): Promise<void> {
    try {
      this.logger.log(`Attempting to send SMS to: ${params.PhoneNumber}`);
      const command = new PublishCommand(params);
      await this.snsClient.send(command);
      this.logger.log("SMS sent successfully.");
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}
