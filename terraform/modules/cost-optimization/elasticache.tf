resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "user-management-redis"
  engine              = "redis"
  node_type           = "cache.t4g.micro"  # Cost-effective ARM-based instance
  num_cache_nodes     = 1
  parameter_group_name = "default.redis6.x"
  port                = 6379
  security_group_ids  = [aws_security_group.redis.id]
  subnet_group_name   = aws_elasticache_subnet_group.redis.name
  
  # Enable automatic backup
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-04:00"
  
  # Enable encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}