package com.nutriai.api.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Utility class to extract the authenticated nutritionist ID from the SecurityContext.
 */
public final class NutritionistAccess {

    private NutritionistAccess() {
        // Utility class
    }

    /**
     * Get the current authenticated nutritionist's UUID from the SecurityContext.
     *
     * @return the nutritionist UUID
     * @throws IllegalStateException if no authentication is found
     */
    public static UUID getCurrentNutritionistId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        return (UUID) authentication.getPrincipal();
    }
}