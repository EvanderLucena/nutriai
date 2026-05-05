package com.nutriai.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaRepositories(basePackages = {"com.nutriai.api.repository", "com.nutriai.api.auth"})
@EnableScheduling
public class NutriAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(NutriAiApplication.class, args);
    }
}