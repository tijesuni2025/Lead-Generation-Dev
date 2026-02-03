terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state configuration (uncomment for production)
  # backend "s3" {
  #   bucket         = "bluestarai-terraform-state"
  #   key            = "leadgen/terraform.tfstate"
  #   region         = "us-east-2"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "BluestarAI"
    }
  }
}

# For CloudFront ACM certificate (must be us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-${var.environment}"

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  
  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = !var.enable_s3_website
  block_public_policy     = !var.enable_s3_website
  ignore_public_acls      = !var.enable_s3_website
  restrict_public_buckets = !var.enable_s3_website
}

resource "aws_s3_bucket_website_configuration" "website" {
  count  = var.enable_s3_website ? 1 : 0
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA routing
  }
}

resource "aws_s3_bucket_policy" "website" {
  count  = var.enable_s3_website ? 1 : 0
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# CLOUDFRONT DISTRIBUTION (Optional - for production) 

resource "aws_cloudfront_origin_access_control" "website" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for ${var.project_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website" {
  count = var.enable_cloudfront ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} distribution"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.website.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.website[0].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400    # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # SPA routing - serve index.html for 404s
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == "" ? true : false
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate.website[0].arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cdn"
  }
}

# CloudFront bucket policy (when using CloudFront)
resource "aws_s3_bucket_policy" "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website[0].arn
          }
        }
      }
    ]
  })
}

# ACM CERTIFICATE (Optional - for custom domain)

resource "aws_acm_certificate" "website" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = var.environment == "production" ? ["www.${var.domain_name}"] : []

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert"
  }
}

# BACKUP BUCKET

resource "aws_s3_bucket" "backups" {
  count  = var.enable_backups ? 1 : 0
  bucket = "${var.project_name}-backups-${var.environment}"

  tags = {
    Name = "${var.project_name}-backups-${var.environment}"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  count  = var.enable_backups ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  rule {
    id     = "cleanup-old-backups"
    status = "Enabled"

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# CLOUDWATCH MONITORING

resource "aws_cloudwatch_metric_alarm" "website_4xx_errors" {
  count = var.enable_cloudfront && var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "High 4xx error rate detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website[0].id
    Region         = "Global"
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

resource "aws_cloudwatch_metric_alarm" "website_5xx_errors" {
  count = var.enable_cloudfront && var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "High 5xx error rate detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website[0].id
    Region         = "Global"
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

# OUTPUTS

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.website.arn
}

output "website_endpoint" {
  description = "S3 website endpoint"
  value       = var.enable_s3_website ? aws_s3_bucket_website_configuration.website[0].website_endpoint : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website[0].id : null
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website[0].domain_name : null
}

output "website_url" {
  description = "Website URL"
  value = var.enable_cloudfront ? (
    var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.website[0].domain_name}"
  ) : (
    var.enable_s3_website ? "http://${aws_s3_bucket_website_configuration.website[0].website_endpoint}" : null
  )
}
