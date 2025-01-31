resource "aws_elasticsearch_domain" "main" {
  domain_name = "user-management-es"
  
  elasticsearch_version = "7.10"

  cluster_config {
    instance_type = "t3.small.elasticsearch"  # Cost-effective instance
    instance_count = 2
    
    zone_awareness_enabled = true
    zone_awareness_config {
      availability_zone_count = 2
    }
    
    # Automatic scaling configuration
    warm_enabled = true
    warm_count = 2
    warm_type = "ultrawarm1.medium.elasticsearch"
  }

  # Enable UltraWarm for cost-effective storage
  snapshot_options {
    automated_snapshot_start_hour = 23
  }

  # Enable encryption
  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  # Configure automated index lifecycle management
  advanced_options = {
    "rest.action.multi.allow_explicit_index" = "true"
    "indices.lifecycle.poll_interval" = "1h"
  }
}