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

  // SMS-related defaults from env
  private readonly defaultSenderId: string | undefined; // For international
  private readonly originationNumber: string | undefined; // Long code / toll-free
  private readonly transactionalType = "Transactional"; // Always Transactional for OTPs

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

    this.defaultSenderId = this.configService.get<string>("AWS_SMS_SENDER_ID");
    this.originationNumber = this.configService.get<string>(
      "AWS_SMS_ORIGINATION_NUMBER"
    );
  }

  /**
   * Send an email via AWS SES
   */
  async sendEmail(params: SendEmailCommandInput): Promise<void> {
    try {
      this.logger.log(
        `Attempting to send email to: ${params.Destination?.ToAddresses?.join(", ")}`
      );
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      this.logger.log("Email sent successfully.");
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send an SMS via AWS SNS/Pinpoint
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      this.logger.log(`Attempting to send SMS to: ${phoneNumber}`);

      const isUSNumber = phoneNumber.startsWith("+1");

      const messageAttributes: Record<string, any> = {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      };

      // Use SenderID for NON-US numbers ONLY
      if (!isUSNumber && this.defaultSenderId) {
        messageAttributes["AWS.SNS.SMS.SenderID"] = {
          DataType: "String",
          StringValue: this.defaultSenderId,
        };
      }

      // Correct attribute for toll-free / long codes
      if (this.originationNumber) {
        messageAttributes["AWS.SNS.SMS.OriginationNumber"] = {
          DataType: "String",
          StringValue: this.originationNumber,
        };
      }

      const params: PublishCommandInput = {
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: messageAttributes,
      };

      const command = new PublishCommand(params);
      const result = await this.snsClient.send(command);

      this.logger.log(`SMS sent successfully. MessageId: ${result.MessageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}
