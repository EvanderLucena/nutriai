-- V12: Rename meal_food.amount → reference_amount
-- MealFood uses the same structure as Food: referenceAmount is the ref value for that meal item
ALTER TABLE meal_food RENAME COLUMN amount TO reference_amount;