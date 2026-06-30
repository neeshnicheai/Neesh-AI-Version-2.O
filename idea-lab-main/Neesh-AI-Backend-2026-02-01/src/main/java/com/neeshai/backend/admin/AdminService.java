package com.neeshai.backend.admin;

import com.neeshai.backend.project.ProjectRepository;
import com.neeshai.backend.promotion.PromotionService;
import com.neeshai.backend.user.User;
import com.neeshai.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${admin.master.username:Admin@neeshi.ai}")
    private String masterAdminUsername;

    @Value("${admin.master.password}")
    private String masterAdminPassword;

    private final AdminRoleRepository adminRoleRepository;
    private final CouponCodeRepository couponCodeRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PromotionService promotionService;

    // Simple token store (in production, use JWT or Redis)
    private final Map<String, String> activeTokens = Collections.synchronizedMap(new HashMap<>());

    public AdminService(AdminRoleRepository adminRoleRepository,
                        CouponCodeRepository couponCodeRepository,
                        UserRepository userRepository,
                        ProjectRepository projectRepository,
                        PromotionService promotionService) {
        this.adminRoleRepository = adminRoleRepository;
        this.couponCodeRepository = couponCodeRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.promotionService = promotionService;
    }

    @PostConstruct
    public void initMasterAdmin() {
        // Ensure master admin exists in DB
        if (!adminRoleRepository.existsByUsername(masterAdminUsername)) {
            AdminRole master = new AdminRole(
                    masterAdminUsername,
                    passwordEncoder.encode(masterAdminPassword),
                    "Super Admin"
            );
            adminRoleRepository.save(master);
            log.info("Master admin role created: {}", masterAdminUsername);
        }
    }

    // --- Authentication ---

    public Optional<AdminDTOs.AdminLoginResponse> authenticate(String username, String password) {
        // Check master admin first
        if (masterAdminUsername.equalsIgnoreCase(username) && masterAdminPassword.equals(password)) {
            String token = generateToken(username);
            return Optional.of(new AdminDTOs.AdminLoginResponse(token, "Super Admin"));
        }

        // Check DB roles
        return adminRoleRepository.findByUsername(username)
                .filter(role -> passwordEncoder.matches(password, role.getPasswordHash()))
                .map(role -> {
                    String token = generateToken(username);
                    return new AdminDTOs.AdminLoginResponse(token, role.getDisplayName());
                });
    }

    public boolean validateToken(String token) {
        return token != null && activeTokens.containsKey(token);
    }

    private String generateToken(String username) {
        String token = UUID.randomUUID().toString();
        activeTokens.put(token, username);
        return token;
    }

    // --- Admin Roles ---

    @Transactional
    public AdminDTOs.AdminRoleDTO createAdminRole(AdminDTOs.CreateRoleRequest request) {
        if (adminRoleRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists: " + request.username());
        }
        AdminRole role = new AdminRole(
                request.username(),
                passwordEncoder.encode(request.password()),
                request.displayName()
        );
        AdminRole saved = adminRoleRepository.save(role);
        log.info("Admin role created: {}", request.username());
        return AdminDTOs.AdminRoleDTO.fromEntity(saved);
    }

    public List<AdminDTOs.AdminRoleDTO> getAllAdminRoles() {
        return adminRoleRepository.findAll().stream()
                .map(AdminDTOs.AdminRoleDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAdminRole(UUID id) {
        adminRoleRepository.findById(id).ifPresent(role -> {
            if (masterAdminUsername.equalsIgnoreCase(role.getUsername())) {
                throw new IllegalArgumentException("Cannot delete the master admin role");
            }
            adminRoleRepository.deleteById(id);
            log.info("Admin role deleted: {}", role.getUsername());
        });
    }

    // --- Users ---

    public List<AdminDTOs.AdminUserDTO> getAllUsersWithStats() {
        List<User> users = userRepository.findAll();
        return users.stream().map(user -> {
            long projectCount = projectRepository.findByOwnerId(user.getId()).size();
            String plan = user.getSubscriptionPlan() != null ? user.getSubscriptionPlan() : "FREE";
            // Capitalize for display: FREE -> Free, PRO -> Pro, ENTERPRISE -> Enterprise
            String displayPlan = plan.substring(0, 1).toUpperCase() + plan.substring(1).toLowerCase();
            long promotedBlogCount = promotionService.getPromotionCountForUser(user.getId());
            List<String> promotionTags = promotionService.getTagsForUser(user.getId());
            return new AdminDTOs.AdminUserDTO(
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getStatus(),
                    user.getOccupation(),
                    user.getPhone(),
                    user.getLocation(),
                    user.getProfileImageUrl(),
                    user.getCreatedAt(),
                    user.getUpdatedAt(),
                    projectCount,
                    displayPlan,
                    promotedBlogCount,
                    promotionTags,
                    user.getSubscriptionExpiresAt()
            );
        }).collect(Collectors.toList());
    }

    // --- Coupons ---

    @Transactional
    public AdminDTOs.CouponDTO createCoupon(AdminDTOs.CreateCouponRequest request) {
        String code = request.code() != null ? request.code().trim().toUpperCase() : "";
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Coupon code cannot be empty.");
        }
        if (couponCodeRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Coupon code already exists: " + code);
        }
        CouponCode coupon = new CouponCode(
                code,
                request.name(),
                request.discountPercentage(),
                request.expiryDate(),
                request.maxUses()
        );
        CouponCode saved = couponCodeRepository.save(coupon);
        log.info("Coupon created: {} ({}% off)", request.code(), request.discountPercentage());
        return AdminDTOs.CouponDTO.fromEntity(saved);
    }

    public List<AdminDTOs.CouponDTO> getAllCoupons() {
        return couponCodeRepository.findAll().stream()
                .map(AdminDTOs.CouponDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCoupon(UUID id) {
        couponCodeRepository.deleteById(id);
        log.info("Coupon deleted: {}", id);
    }

    public AdminDTOs.ValidateCouponResponse validateCoupon(String code) {
        if (code == null || code.trim().isEmpty()) {
            return new AdminDTOs.ValidateCouponResponse(false, 0, "Invalid coupon code.");
        }
        String cleanCode = code.trim().toUpperCase();
        return couponCodeRepository.findByCodeIgnoreCase(cleanCode)
                .map(coupon -> {
                    if (!coupon.isActive()) {
                        return new AdminDTOs.ValidateCouponResponse(false, 0, "This coupon has been deactivated.");
                    }
                    if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(java.time.ZonedDateTime.now())) {
                        return new AdminDTOs.ValidateCouponResponse(false, 0, "This coupon has expired.");
                    }
                    if (coupon.getUsedCount() >= coupon.getMaxUses()) {
                        return new AdminDTOs.ValidateCouponResponse(false, 0, "This coupon has reached its maximum usage limit.");
                    }
                    return new AdminDTOs.ValidateCouponResponse(true, coupon.getDiscountPercentage(),
                            "Coupon valid! " + coupon.getDiscountPercentage() + "% discount applied.");
                })
                .orElse(new AdminDTOs.ValidateCouponResponse(false, 0, "Invalid coupon code."));
    }

    @Transactional
    public boolean applyCoupon(String code) {
        if (code == null) return false;
        return couponCodeRepository.findByCodeIgnoreCase(code.trim().toUpperCase())
                .filter(CouponCode::isValid)
                .map(coupon -> {
                    coupon.setUsedCount(coupon.getUsedCount() + 1);
                    couponCodeRepository.save(coupon);
                    return true;
                })
                .orElse(false);
    }
}
