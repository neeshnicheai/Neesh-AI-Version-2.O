package com.neeshai.backend.payment;

import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CashfreeOrderResponse {
    private String cf_order_id;
    private String order_id;
    private String entity;
    private String order_currency;
    private double order_amount;
    private String order_status;
    private String payment_session_id;
    private String order_expiry_time;
}
