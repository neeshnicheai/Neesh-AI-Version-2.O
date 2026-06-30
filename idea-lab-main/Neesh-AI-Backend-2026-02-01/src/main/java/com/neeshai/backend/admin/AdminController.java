package com.neeshai.backend.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // --- Helper: validate admin token from header ---
    private boolean isAuthorized(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("AdminToken ")) {
            return false;
        }
        String token = authHeader.substring("AdminToken ".length());
        return adminService.validateToken(token);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body("Unauthorized: Invalid or missing admin token");
    }

    // --- Auth ---

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminDTOs.AdminLoginRequest request) {
        log.info("Admin login attempt for: {}", request.username());
        return adminService.authenticate(request.username(), request.password())
                .map(resp -> {
                    log.info("Admin login successful for: {}", request.username());
                    return ResponseEntity.ok(resp);
                })
                .orElseGet(() -> {
                    log.warn("Admin login failed for: {}", request.username());
                    return ResponseEntity.status(401).build();
                });
    }

    // --- Users ---

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        List<AdminDTOs.AdminUserDTO> users = adminService.getAllUsersWithStats();
        return ResponseEntity.ok(users);
    }

    // --- Admin Roles ---

    @PostMapping("/roles")
    public ResponseEntity<?> createRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody AdminDTOs.CreateRoleRequest request) {
        if (!isAuthorized(authHeader)) return unauthorized();
        try {
            AdminDTOs.AdminRoleDTO role = adminService.createAdminRole(request);
            return ResponseEntity.ok(role);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getAllRoles(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        return ResponseEntity.ok(adminService.getAllAdminRoles());
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<?> deleteRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id) {
        if (!isAuthorized(authHeader)) return unauthorized();
        try {
            adminService.deleteAdminRole(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- Coupons ---

    @PostMapping("/coupons")
    public ResponseEntity<?> createCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody AdminDTOs.CreateCouponRequest request) {
        if (!isAuthorized(authHeader)) return unauthorized();
        try {
            AdminDTOs.CouponDTO coupon = adminService.createCoupon(request);
            return ResponseEntity.ok(coupon);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/coupons")
    public ResponseEntity<?> getAllCoupons(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        return ResponseEntity.ok(adminService.getAllCoupons());
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<?> deleteCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id) {
        if (!isAuthorized(authHeader)) return unauthorized();
        adminService.deleteCoupon(id);
        return ResponseEntity.ok().build();
    }

    // --- Public: Validate coupon (for users applying coupon) ---

    @PostMapping("/coupons/validate")
    public ResponseEntity<AdminDTOs.ValidateCouponResponse> validateCoupon(@RequestBody AdminDTOs.ValidateCouponRequest request) {
        return ResponseEntity.ok(adminService.validateCoupon(request.code()));
    }
}
