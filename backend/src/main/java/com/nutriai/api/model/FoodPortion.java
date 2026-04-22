package com.nutriai.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Food portion entity for BASE foods.
 * Each portion describes a named serving size (e.g., "colher", "xícara").
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "food_portion")
public class FoodPortion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "food_id", nullable = false)
    private UUID foodId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 10, scale = 1)
    private BigDecimal grams;

    @Column(name = "sort_order")
    private Integer sortOrder;
}