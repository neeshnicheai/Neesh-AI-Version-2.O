package com.neeshai.backend.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
public class CashfreeService {

    private static final Logger log = LoggerFactory.getLogger(CashfreeService.class);

    @Value("${cashfree.app.id}")
    private String appId;

    @Value("${cashfree.secret.key}")
    private String secretKey;

    @Value("${cashfree.api.url}")
    private String apiUrl;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    public CashfreeService() {
        this.restTemplate = new RestTemplate();
    }

    public CashfreeOrderResponse createOrder(UUID userId, String email, String name, double amount) {
        String orderId = "order_" + userId.toString().substring(0, 8) + "_" + System.currentTimeMillis();

        CashfreeOrderRequest request = CashfreeOrderRequest.builder()
                .order_id(orderId)
                .order_amount(amount)
                .order_currency("USD")
                .customer_details(CashfreeOrderRequest.CustomerDetails.builder()
                        .customer_id(userId.toString())
                        .customer_email(email)
                        .customer_name(name)
                        .customer_phone("9999999999") // Required by Cashfree, could be dummy if not available
                        .build())
                .order_meta(CashfreeOrderRequest.OrderMeta.builder()
                        .return_url(frontendUrl + "/dashboard?order_id={order_id}")
                        .build())
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-version", "2023-08-01");
        headers.set("x-client-id", appId);
        headers.set("x-client-secret", secretKey);

        HttpEntity<CashfreeOrderRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.info("Creating Cashfree order: {} for user: {}", orderId, userId);
            ResponseEntity<CashfreeOrderResponse> response = restTemplate.postForEntity(
                    apiUrl + "/orders", entity, CashfreeOrderResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                return response.getBody();
            } else {
                log.error("Failed to create Cashfree order. Status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to create Cashfree order");
            }
        } catch (Exception e) {
            log.error("Error creating Cashfree order: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating Cashfree order", e);
        }
    }

    public boolean verifyPayment(String orderId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-version", "2023-08-01");
        headers.set("x-client-id", appId);
        headers.set("x-client-secret", secretKey);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<CashfreeOrderResponse> response = restTemplate.exchange(
                    apiUrl + "/orders/" + orderId, HttpMethod.GET, entity, CashfreeOrderResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String status = response.getBody().getOrder_status();
                log.info("Payment status for order {}: {}", orderId, status);
                return "PAID".equalsIgnoreCase(status);
            }
        } catch (Exception e) {
            log.error("Error verifying payment for order {}: {}", orderId, e.getMessage());
        }
        return false;
    }
}
