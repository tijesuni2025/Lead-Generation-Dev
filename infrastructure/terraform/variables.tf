variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "bluestaraileadgen"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "enable_s3_website" {
  description = "Enable S3 static website hosting (disable when using CloudFront)"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN distribution"
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200",
      "PriceClass_100"
    ], var.cloudfront_price_class)
    error_message = "Invalid CloudFront price class"
  }
}

variable "domain_name" {
  description = "Custom domain name (leave empty for CloudFront default)"
  type        = string
  default     = ""
}

variable "enable_backups" {
  description = "Enable backup bucket for deployment rollbacks"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and alarms"
  type        = bool
  default     = false
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
  default     = ""
}
