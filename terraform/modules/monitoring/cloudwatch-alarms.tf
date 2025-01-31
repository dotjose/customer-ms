resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "api-latency-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic          = "Average"
  threshold          = "1000"  # 1 second
  alarm_description  = "API latency is too high"
  alarm_actions      = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "error-rate-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "Error rate is too high"
  alarm_actions      = [aws_sns_topic.alerts.arn]
}