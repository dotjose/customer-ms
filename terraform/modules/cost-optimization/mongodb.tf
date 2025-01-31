resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier  = "user-management-mongodb"
  engine             = "docdb"
  master_username    = var.mongodb_username
  master_password    = var.mongodb_password
  
  # Cost optimization
  instance_class     = "db.t4g.medium"  # ARM-based instance
  deletion_protection = true
  skip_final_snapshot = false
  
  # Enable encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.mongodb.arn
  
  # Backup configuration
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  # Enable monitoring
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]
}