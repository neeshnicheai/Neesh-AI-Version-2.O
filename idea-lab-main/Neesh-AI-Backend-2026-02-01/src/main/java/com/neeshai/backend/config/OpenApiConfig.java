package com.neeshai.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3 configuration for Neesh AI Backend
 *
 * Provides Swagger UI documentation for all API endpoints
 * Available at: /swagger-ui.html
 * JSON docs at: /api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @Bean
    public OpenAPI neeshAiOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Neesh AI Backend API")
                        .description("REST API for Neesh AI - RAG-powered chatbot platform")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Neesh AI Team")
                                .email("support@neeshi.ai")
                                .url("https://neeshi.ai"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Development server"),
                        new Server()
                                .url("https://api.neeshi.ai")
                                .description("Production server")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT token obtained from Supabase Auth")));
    }
}