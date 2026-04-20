package com.nutriai.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.nutriai.api.repository")
public class NutriAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(NutriAiApplication.class, args);
    }
}