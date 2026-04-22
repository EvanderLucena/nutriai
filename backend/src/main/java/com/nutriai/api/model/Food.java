package com.nutriai.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Food catalog entity (D-08: data isolated by nutritionist_id).
 * BASE type stores per-100g nutrition data with portions.
 * PRESET type stores pre-calculated nutrition per serving.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "food_catalog")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @Column(nullable = false)
    private String type; // "BASE" or "PRESET"

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String category;

    // BASE-only fields: nutrition per 100g
    @Column(name = "per100_kcal", precision = 10, scale = 1)
    private BigDecimal per100Kcal;

    @Column(name = "per100_prot", precision = 10, scale = 1)
    private BigDecimal per100Prot;

    @Column(name = "per100_carb", precision = 10, scale = 1)
    private BigDecimal per100Carb;

    @Column(name = "per100_fat", precision = 10, scale = 1)
    private BigDecimal per100Fat;

    @Column(name = "per100_fiber", precision = 10, scale = 1)
    private BigDecimal per100Fiber;

    // PRESET-only fields: pre-calculated per serving
    @Column(name = "preset_grams", precision = 10, scale = 1)
    private BigDecimal presetGrams;

    @Column(name = "preset_kcal", precision = 10, scale = 1)
    private BigDecimal presetKcal;

    @Column(name = "preset_prot", precision = 10, scale = 1)
    private BigDecimal presetProt;

    @Column(name = "preset_carb", precision = 10, scale = 1)
    private BigDecimal presetCarb;

    @Column(name = "preset_fat", precision = 10, scale = 1)
    private BigDecimal presetFat;

    @Column(name = "portion_label", length = 200)
    private String portionLabel;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Cascade handled at DB level (ON DELETE CASCADE in V5 migration) and service layer
    // No JPA cascade since child uses raw UUID FK, not @ManyToOne

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (usedCount == null) {
            usedCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}