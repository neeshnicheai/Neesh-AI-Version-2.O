package com.neeshai.backend.payment;

import com.neeshai.backend.admin.CouponCode;
import com.neeshai.backend.admin.CouponCodeRepository;
import com.neeshai.backend.user.UserService;
import com.neeshai.backend.user.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private static final double PRO_PLAN_PRICE = 9.99; // USD

    private final CashfreeService cashfreeService;
    private final UserService userService;
    private final CouponCodeRepository couponCodeRepository;

    public PaymentController(CashfreeService cashfreeService, UserService userService,
                             CouponCodeRepository couponCodeRepository) {
        this.cashfreeService = cashfreeService;
        this.userService = userService;
        this.couponCodeRepository = couponCodeRepository;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@AuthenticationPrincipal Jwt jwt, @RequestBody Map<String, Object> request) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            String email = jwt.getClaimAsString("email");
            String name = jwt.getClaimAsString("name");

            double baseAmount = PRO_PLAN_PRICE;
            double finalAmount = baseAmount;
            String couponCode = null;
            int discountPercentage = 0;

            // ── Coupon validation (server-side) ──
            if (request.containsKey("couponCode") && request.get("couponCode") != null) {
                couponCode = request.get("couponCode").toString().trim().toUpperCase();
                if (!couponCode.isEmpty()) {
                    Optional<CouponCode> couponOpt = couponCodeRepository.findByCodeIgnoreCase(couponCode);
                    if (couponOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid coupon code"));
                    }
                    CouponCode coupon = couponOpt.get();
                    if (!coupon.isValid()) {
                        String reason = !coupon.isActive() ? "Coupon is no longer active"
                                : coupon.getUsedCount() >= coupon.getMaxUses() ? "Coupon usage limit reached"
                                : "Coupon has expired";
                        return ResponseEntity.badRequest().body(Map.of("error", reason));
                    }

                    discountPercentage = coupon.getDiscountPercentage();

                    // Calculate discounted amount carefully
                    BigDecimal base = BigDecimal.valueOf(baseAmount);
                    BigDecimal discount = base.multiply(BigDecimal.valueOf(discountPercentage))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    finalAmount = base.subtract(discount).setScale(2, RoundingMode.HALF_UP).doubleValue();

                    // Ensure minimum $0.01 (Cashfree won't accept $0)
                    if (finalAmount < 0.01) finalAmount = 0.01;

                    // Increment used count
                    coupon.setUsedCount(coupon.getUsedCount() + 1);
                    couponCodeRepository.save(coupon);

                    log.info("Coupon {} applied for user {}. Discount: {}%, Final: ${}", couponCode, userId, discountPercentage, finalAmount);
                }
            }

            CashfreeOrderResponse response = cashfreeService.createOrder(userId, email, name, finalAmount);

            // Return enriched response with price details
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("payment_session_id", response.getPayment_session_id());
            result.put("order_id", response.getOrder_id());
            result.put("order_status", response.getOrder_status());
            result.put("originalAmount", baseAmount);
            result.put("finalAmount", finalAmount);
            result.put("discountPercentage", discountPercentage);
            result.put("couponApplied", couponCode);
            result.put("currency", "USD");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error creating payment order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-status")
    public ResponseEntity<?> verifyPayment(@AuthenticationPrincipal Jwt jwt, @RequestBody Map<String, String> request) {
        try {
            String orderId = request.get("order_id");
            if (orderId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "order_id is required"));
            }

            boolean isPaid = cashfreeService.verifyPayment(orderId);
            if (isPaid) {
                UUID userId = UUID.fromString(jwt.getSubject());
                String email = jwt.getClaimAsString("email");
                String name = jwt.getClaimAsString("name");
                UserDTO updatedUser = userService.upgradeToPro(userId, email, name);
                log.info("User {} successfully upgraded to PRO after payment verify", userId);
                return ResponseEntity.ok(Map.of("status", "SUCCESS", "user", updatedUser));
            } else {
                return ResponseEntity.ok(Map.of("status", "PENDING_OR_FAILED"));
            }
        } catch (Exception e) {
            log.error("Error verifying payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
