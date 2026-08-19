variable "DOCKERHUB_NAMESPACE" {
  default = "flyingphoenix"
}

variable "IMAGE_TAG" {
  default = "v1"
}

variable "VITE_API_URL" {
  default = "https://finflowapi.sushildubey.cloud/api"
}

variable "GOOGLE_CLIENT_ID" {
  default = "308538071428-7q5jq8q7k02tfbs4jr2j5vbd0n32r1gq.apps.googleusercontent.com"
}

group "default" {
  targets = ["frontend", "backend"]
}

target "frontend" {
  context = "./frontend"
  dockerfile = "Dockerfile"
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "${DOCKERHUB_NAMESPACE}/finflow-frontend:${IMAGE_TAG}",
    "${DOCKERHUB_NAMESPACE}/finflow-frontend:latest"
  ]
  args = {
    VITE_API_URL = "${VITE_API_URL}"
    VITE_GOOGLE_CLIENT_ID = "${GOOGLE_CLIENT_ID}"
  }
}

target "backend" {
  context = "./backend"
  dockerfile = "Dockerfile"
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "${DOCKERHUB_NAMESPACE}/finflow-backend:${IMAGE_TAG}",
    "${DOCKERHUB_NAMESPACE}/finflow-backend:latest"
  ]
}
