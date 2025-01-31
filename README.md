# Customer Management Microservice

This is a user authentication and management microservice following DDD and CQRS design patterns, built on top of MongoDB and the NestJS framework. It uses Docker, Terraform, and monitoring services like Prometheus.

## Table of Contents
- Features
- Environment Variables
- Local Deployment
- Production Deployment
- Monitoring

## Features
- User authentication and management
- Follows DDD and CQRS design patterns
- Uses MongoDB and NestJS framework
- Docker for containerization
- Terraform for infrastructure management
- Monitoring with Prometheus

## Environment Variables
Create a `.env` file in the root directory and add the following variables:

```env
# DB Configuration
MONGODB_URI=mongodb://localhost:27017/users
JWT_SECRET=your-secure-jwt-secret

# AWS SES Configuration
AWS_REGION=us-east-1

# Elastic Search Configuration
ELASTICSEARCH_URL=http://localhost:9200

# OPENAI Key Configuration
OPENAI_API_KEY=your-api-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Local Deployment

### Prerequisites
- Docker installed on your machine
- Node.js installed on your machine

### Steps
1. Clone the repository:
    ```sh
    git clone https://github.com/dotjose/customer-ms.git
    cd customer-ms
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Run the application in development mode with real-time coding support:
    ```sh
    npm run start:dev
    ```

4. Alternatively, run the application using PM2 for better process management:
    ```sh
    pm2 start dist/main.js --name customer-ms
    ```

### Docker Deployment
1. Build the Docker image:
    ```sh
    docker build -t customer-ms .
    ```

2. Run the Docker container:
    ```sh
    docker run -p 3000:3000 --env-file .env customer-ms
    ```

## Production Deployment

### Prerequisites
- AWS account
- Terraform installed on your machine
- Docker installed on your machine

### Steps
1. Clone the repository:
    ```sh
    git clone https://github.com/dotjose/customer-ms.git
    cd customer-ms
    ```

2. Initialize and apply Terraform configurations:
    ```sh
    cd terraform
    terraform init
    terraform apply
    ```

3. Build the Docker image:
    ```sh
    docker build -t customer-ms .
    ```

4. Push the Docker image to your container registry (e.g., AWS ECR):
    ```sh
    docker tag customer-ms:latest <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/customer-ms:latest
    docker push <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/customer-ms:latest
    ```

5. Deploy the Docker container on AWS ECS using the Terraform configurations.

## Monitoring
This microservice uses Prometheus for monitoring. Ensure you have Prometheus set up and configured to scrape metrics from the application.

For further assistance or questions, please refer to the respective documentation of the tools and frameworks used.

You can view the [Dockerfile](https://github.com/dotjose/customer-ms/blob/main/Dockerfile) and [Terraform configuration](https://github.com/dotjose/customer-ms/blob/main/terraform/main.tf) for more details.
