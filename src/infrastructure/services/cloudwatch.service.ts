import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
} from "@aws-sdk/client-cloudwatch";

@Injectable()
export class CloudWatchService {
  private readonly client: CloudWatchClient;
  private readonly namespace: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new CloudWatchClient({
      region: this.configService.get<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get<string>(
          "AWS_SECRET_ACCESS_KEY"
        ),
      },
    });
    this.namespace = "UserManagementService";
  }

  async putMetric(
    name: string,
    value: number,
    unit: "Count",
    dimensions?: Record<string, string>
  ) {
    const metric: MetricDatum = {
      MetricName: name,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: dimensions
        ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    };

    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [metric],
    });

    await this.client.send(command);
  }
}
