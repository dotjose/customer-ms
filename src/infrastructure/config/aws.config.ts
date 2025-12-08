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
  private readonly defaultSenderId: string | undefined;
  private readonly tollFreeNumber: string; // Changed from pool ARN to actual number
  private readonly transactionalType = "Transactional";

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
    
    // Store your actual toll-free number (e.g., +18885551234), not pool ARN
    this.tollFreeNumber = this.configService.get<string>(
      "AWS_SMS_TOLL_FREE_NUMBER"
    )!;
  }

  /**
   * Send an email via AWS SES
   */
  async sendEmail(params: SendEmailCommandInput): Promise<void> {
    try {
      this.logger.log(
        `Attempting to send email to: ${params.Destination?.ToAddresses?.join(
          ", "
        )}`
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
   * Send an SMS via AWS SNS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      this.logger.log(`Attempting to send SMS to: ${phoneNumber}`);

      const params: PublishCommandInput = {
        PhoneNumber: phoneNumber,
        Message: message,
      };

      // Add message attributes for SMS
      const messageAttributes: Record<string, any> = {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: this.transactionalType,
        },
      };

      // For non-US numbers, add SenderID if configured
      const isUSNumber = phoneNumber.startsWith("+1");
      if (!isUSNumber && this.defaultSenderId) {
        messageAttributes["AWS.SNS.SMS.SenderID"] = {
          DataType: "String",
          StringValue: this.defaultSenderId,
        };
      }

      // Only add attributes if we have any
      if (Object.keys(messageAttributes).length > 0) {
        params.MessageAttributes = messageAttributes;
      }

      // For toll-free numbers, you have two options:

      // OPTION 1: If you want to send FROM your toll-free number
      // (Note: This requires the toll-free number to be verified in SNS)
      // if (isUSNumber && this.tollFreeNumber) {
      //   // Send from your toll-free number
      //   params.PhoneNumber = phoneNumber; // Recipient
      //   // You would use OriginationNumber in the SMS preferences in AWS Console
      //   // or verify and use the number directly
      // }

      const command = new PublishCommand(params);
      const result = await this.snsClient.send(command);

      this.logger.log(`SMS sent successfully. MessageId: ${result.MessageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      this.logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS using a specific toll-free number as the sender
   * (Requires toll-free number to be verified in SNS)
   */
  async sendSMSFromTollFree(
    phoneNumber: string, 
    message: string, 
    useTollFree: boolean = true
  ): Promise<void> {
    try {
      if (useTollFree && !this.tollFreeNumber) {
        throw new Error("Toll-free number is not configured");
      }

      const params: PublishCommandInput = {
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: this.transactionalType,
          },
        },
      };

      // If using toll-free as sender, it must be verified in SNS
      // and you need to configure it in AWS Console under SNS -> Text messaging
      if (useTollFree) {
        this.logger.log(`Sending SMS from toll-free: ${this.tollFreeNumber}`);
        // Note: The sender number is configured in AWS Console, not in API call
      }

      const command = new PublishCommand(params);
      const result = await this.snsClient.send(command);

      this.logger.log(`SMS sent successfully. MessageId: ${result.MessageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}