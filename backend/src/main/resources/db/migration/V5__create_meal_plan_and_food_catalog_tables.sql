-- V5: Create meal plan and food catalog tables
-- Food catalog (D-08: nutritionist-scoped data isolation)
-- Meal plan linked 1:1 to episode (D-13)
-- Frozen macros in meal_food (D-05: decoupled from catalog)
-- Nullable food_id FK with ON DELETE SET NULL (D-10: plan survives catalog deletion)

CREATE TABLE food_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BASE', 'PRESET')),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    -- BASE fields: nutrition per 100g
    per100_kcal DECIMAL(10,1),
    per100_prot DECIMAL(10,1),
    per100_carb DECIMAL(10,1),
    per100_fat DECIMAL(10,1),
    per100_fiber DECIMAL(10,1),
    -- PRESET fields: pre-calculated per serving
    preset_grams DECIMAL(10,1),
    preset_kcal DECIMAL(10,1),
    preset_prot DECIMAL(10,1),
    preset_carb DECIMAL(10,1),
    preset_fat DECIMAL(10,1),
    portion_label VARCHAR(200),
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_catalog_nutritionist ON food_catalog(nutritionist_id);
CREATE INDEX idx_food_catalog_category ON food_catalog(category);

CREATE TABLE food_portion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES food_catalog(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grams DECIMAL(10,1),
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_portion_food ON food_portion(food_id);

-- Meal plan: 1:1 with episode (UNIQUE constraint on episode_id)
CREATE TABLE meal_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL UNIQUE REFERENCES episode(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'Plano alimentar',
    notes TEXT,
    kcal_target DECIMAL(10,1) DEFAULT 1800,
    prot_target DECIMAL(10,1) DEFAULT 90,
    carb_target DECIMAL(10,1) DEFAULT 200,
    fat_target DECIMAL(10,1) DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_episode ON meal_plan(episode_id);
CREATE INDEX idx_meal_plan_nutritionist ON meal_plan(nutritionist_id);

CREATE TABLE meal_slot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES meal_plan(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    time VARCHAR(5),
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_slot_plan ON meal_slot(plan_id);

CREATE TABLE meal_option (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_slot_id UUID NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_option_slot ON meal_option(meal_slot_id);

CREATE TABLE meal_food (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES meal_option(id) ON DELETE CASCADE,
    food_id UUID REFERENCES food_catalog(id) ON DELETE SET NULL,
    food_name VARCHAR(200) NOT NULL,
    qty VARCHAR(200),
    grams DECIMAL(10,1),
    prep VARCHAR(200),
    kcal DECIMAL(10,1),
    prot DECIMAL(10,1),
    carb DECIMAL(10,1),
    fat DECIMAL(10,1),
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_food_option ON meal_food(option_id);
CREATE INDEX idx_meal_food_food ON meal_food(food_id);

CREATE TABLE plan_extra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES meal_plan(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity VARCHAR(200),
    kcal DECIMAL(10,1),
    prot DECIMAL(10,1),
    carb DECIMAL(10,1),
    fat DECIMAL(10,1),
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_extra_plan ON plan_extra(plan_id);