package com.neeshai.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate configuration with proper timeouts for production use.
 * Prevents hanging requests that could consume all available threads.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        // Use SimpleClientHttpRequestFactory for basic timeout configuration
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);     // 5 seconds to establish connection
        factory.setReadTimeout(30000);       // 30 seconds to read response

        return new RestTemplate(factory);
    }
}