FROM swaggerapi/swagger-ui:v5.11.0

# Copy the OpenAPI specification to a temporary location
COPY openapi.json /tmp/api.json

# Set environment variables for Swagger UI
ENV SWAGGER_JSON=/tmp/api.json
ENV BASE_URL=/api

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1 