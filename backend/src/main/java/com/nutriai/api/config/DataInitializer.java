package com.nutriai.api.config;

import com.nutriai.api.model.Nutritionist;
import com.nutriai.api.model.UserRole;
import com.nutriai.api.repository.NutritionistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final NutritionistRepository nutritionistRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${nutriai.seed.admin.email:admin@nutriai.com}")
    private String adminEmail;

    @Value("${nutriai.seed.admin.password:Admin123!}")
    private String adminPassword;

    @Value("${nutriai.seed.admin.name:Admin NutriAI}")
    private String adminName;

    public DataInitializer(NutritionistRepository nutritionistRepository, PasswordEncoder passwordEncoder) {
        this.nutritionistRepository = nutritionistRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!nutritionistRepository.existsByEmail(adminEmail)) {
            Nutritionist admin = Nutritionist.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .crn("00000")
                    .crnRegional("SP")
                    .role(UserRole.ADMIN)
                    .onboardingCompleted(true)
                    .subscriptionTier("UNLIMITED")
                    .patientLimit(9999)
                    .build();

            nutritionistRepository.save(admin);
            logger.info("Admin seed created — email: {} | password: {}", adminEmail, adminPassword);
        } else {
            logger.info("Admin already exists ({}), skipping seed", adminEmail);
        }
    }
}