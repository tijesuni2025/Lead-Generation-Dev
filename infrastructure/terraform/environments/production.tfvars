
environment        = "production"
project_name       = "bluestaraileadgen"
aws_region         = "us-east-2"

# S3 Configuration (disable when using CloudFront)
enable_s3_website  = false

# CloudFront CDN (recommended for production)
enable_cloudfront       = true
cloudfront_price_class  = "PriceClass_100"  # US, Canada, Europe

# Custom domain (uncomment and set when ready)
# domain_name = "app.bluestarai.world"

# Backups
enable_backups        = true
backup_retention_days = 30

# Monitoring
enable_monitoring    = true
# alarm_sns_topic_arn = "arn:aws:sns:us-east-2:123456789012:alerts"
