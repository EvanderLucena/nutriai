---
phase: 05-meal-plans-food-catalog
reviewed: 2026-04-22T12:30:00Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - backend/src/main/java/com/nutriai/api/controller/FoodController.java
  - backend/src/main/java/com/nutriai/api/controller/PlanController.java
  - backend/src/main/java/com/nutriai/api/dto/food/CreateFoodRequest.java
  - backend/src/main/java/com/nutriai/api/dto/food/FoodPortionDto.java
  - backend/src/main/java/com/nutriai/api/dto/food/FoodResponse.java
  - backend/src/main/java/com/nutriai/api/dto/food/UpdateFoodRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/AddExtraRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/AddFoodItemRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/AddMealSlotRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/AddOptionRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/ExtraResponse.java
  - backend/src/main/java/com/nutriai/api/dto/plan/MealFoodResponse.java
  - backend/src/main/java/com/nutriai/api/dto/plan/MealOptionResponse.java
  - backend/src/main/java/com/nutriai/api/dto/plan/MealSlotResponse.java
  - backend/src/main/java/com/nutriai/api/dto/plan/PlanResponse.java
  - backend/src/main/java/com/nutriai/api/dto/plan/UpdateExtraRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/UpdateFoodItemRequest.java
  - backend/src/main/java/com/nutriai/api/dto/plan/UpdatePlanRequest.java
  - backend/src/main/java/com/nutriai/api/model/Food.java
  - backend/src/main/java/com/nutriai/api/model/FoodPortion.java
  - backend/src/main/java/com/nutriai/api/model/MealFood.java
  - backend/src/main/java/com/nutriai/api/model/MealOption.java
  - backend/src/main/java/com/nutriai/api/model/MealPlan.java
  - backend/src/main/java/com/nutriai/api/model/MealSlot.java
  - backend/src/main/java/com/nutriai/api/model/PlanExtra.java
  - backend/src/main/java/com/nutriai/api/repository/FoodPortionRepository.java
  - backend/src/main/java/com/nutriai/api/repository/FoodRepository.java
  - backend/src/main/java/com/nutriai/api/repository/MealFoodRepository.java
  - backend/src/main/java/com/nutriai/api/repository/MealOptionRepository.java
  - backend/src/main/java/com/nutriai/api/repository/MealPlanRepository.java
  - backend/src/main/java/com/nutriai/api/repository/MealSlotRepository.java
  - backend/src/main/java/com/nutriai/api/repository/PlanExtraRepository.java
  - backend/src/main/java/com/nutriai/api/service/FoodService.java
  - backend/src/main/java/com/nutriai/api/service/MealPlanService.java
  - backend/src/main/java/com/nutriai/api/service/PatientService.java
  - backend/src/main/resources/db/migration/V5__create_meal_plan_and_food_catalog_tables.sql
  - frontend/src/api/foods.ts
  - frontend/src/api/plans.ts
  - frontend/src/stores/foodStore.ts
  - frontend/src/stores/planStore.ts
  - frontend/src/components/plan/SaveStatusIndicator.tsx
  - frontend/src/components/plan/PortionChips.tsx
  - frontend/src/components/ui/Toast.tsx
  - frontend/src/components/plan/AddFoodModal.tsx
  - frontend/src/components/plan/PlanFoodRow.tsx
  - frontend/src/components/plan/ExtrasSection.tsx
  - frontend/src/components/plan/AddMealModal.tsx
  - frontend/src/components/plan/EditFoodModal.tsx
  - frontend/src/components/plan/index.ts
  - frontend/src/views/PlansView.tsx
  - frontend/src/views/FoodsView.tsx
  - frontend/src/App.tsx
  - frontend/src/views/PatientView.tsx
findings:
  critical: 1
  warning: 8
  info: 6
  total: 15
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-22T12:30:00Z
**Depth:** standard
**Files Reviewed:** 53
**Status:** issues_found

## Summary

Phase 5 implements the food catalog CRUD (backend + frontend) and meal plan CRUD with macro calculation, auto-creation, frozen macros, auto-save with optimistic updates, and new UI components (SaveStatusIndicator, PortionChips, Toast). The overall architecture is sound — nutritionist-scoped data isolation is enforced at every level, the frozen macro pattern (D-10) is correctly implemented, and the dual Zustand+TanStack Query pattern is well-applied.

One critical bug was found: the `updateMealSlot` backend endpoint accepts query parameters (`@RequestParam`) but the frontend sends a JSON body, meaning meal slot updates will always be silently ignored. Several warnings involve authorization gaps (unused path variables), unchecked optimistic update mutations, and a cross-site scripting risk in the PDF export. Info items cover typos and minor code quality concerns.

## Critical Issues

### CR-01: Frontend sends JSON body to `updateMealSlot` but backend expects `@RequestParam`

**File:** `backend/src/main/java/com/nutriai/api/controller/PlanController.java:52-62` and `frontend/src/api/plans.ts:90-100`

**Issue:** The `PATCH /meals/{mealId}` endpoint uses `@RequestParam(required = false)` for `label` and `time`, meaning it expects query parameters like `?label=Almoço&time=12:30`. However, the frontend `updateMealSlot()` function sends a JSON body via `apiClient.patch(..., data)` where `data` is an object `{ label, time }`. Since Spring Boot ignores the JSON body when parameters are declared as `@RequestParam`, all meal slot update calls will silently do nothing — the label and time will remain `null` on the server side, and the service method won't update any field.

**Fix:** Change the backend to accept a `@RequestBody` instead of `@RequestParam`:
```java
@PatchMapping("/meals/{mealId}")
public ResponseEntity<ApiResponse<MealSlotResponse>> updateMealSlot(
        @PathVariable UUID patientId,
        @PathVariable UUID mealId,
        @RequestBody @Valid UpdateMealSlotRequest request
) {
    UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
    MealSlotResponse response = mealPlanService.updateMealSlot(
        nutritionistId, mealId, request.label(), request.time());
    return ResponseEntity.ok(ApiResponse.ok(response));
}
```
Or alternatively, change the frontend to pass query parameters. The `@RequestBody` approach is preferred as it's consistent with other PATCH endpoints in this controller.

## Warnings

### WR-01: `PlanController.updateMealSlot` and `updateOption` ignore `patientId` path variable for authorization

**File:** `backend/src/main/java/com/nutriai/api/controller/PlanController.java:52-62` and `85-95`

**Issue:** The `updateMealSlot`, `deleteMealSlot`, `updateOption`, `deleteOption`, `updateFoodItem`, and `deleteFoodItem` endpoints receive `patientId` as a `@PathVariable` but never pass it to the service layer. They only pass `nutritionistId` and the direct child ID (mealId, optionId, itemId). The service verifies ownership by walking the chain MealFood→MealOption→MealSlot→MealPlan→nutritionistId, which is correct for nutritionist isolation. However, the `patientId` in the URL is unused, creating a misleading API contract — a caller could put any patientId in the URL and the request would still succeed as long as they own the meal option/item through a different patient. This is an authorization gap where the API implies patient-scoping but doesn't enforce it.

**Fix:** Either (a) pass `patientId` to the service and verify the chain goes through the correct patient, or (b) remove `patientId` from these nested-resource endpoints (since they're redundant — the mealSlotId/optionId already uniquely identify the resource). Option (b) is simpler and avoids the misleading contract:
```java
// Simplify URL to not include patientId for nested resources
@PatchMapping("/meals/{mealId}")
public ResponseEntity<ApiResponse<MealSlotResponse>> updateMealSlot(
        @PathVariable UUID mealId,
        @RequestBody @Valid UpdateMealSlotRequest request) { ... }
```

### WR-02: `MealPlanService.updateMealSlot` response construction is fragile with fallback to random UUID

**File:** `backend/src/main/java/com/nutriai/api/service/MealPlanService.java:168-183`

**Issue:** When building the `MealSlotResponse`, the code calls `mealFoodRepository.findByOptionIdOrderBySortOrder(...)` with the first option's ID. If no options exist for the slot (which shouldn't happen given the service always creates one, but is theoretically possible after manual DB manipulation), the code falls back to `UUID.randomUUID()` — this will return an empty list silently, which is fine functionally. However, the approach of querying options twice (once for the response, once already traversed in the slot) is wasteful. More importantly, if there are multiple options, only the first option's food items are returned in the `MealSlotResponse`, which contradicts the design where a slot has multiple options.

**Fix:** The `updateMealSlot` response should be built using `buildPlanResponse`-like logic, or at minimum use `MealSlotResponse.from(slot, options, items)` with all options and items. Currently it returns only the first option's items, missing the other options entirely:
```java
public MealSlotResponse updateMealSlot(UUID nutritionistId, UUID mealSlotId, String label, String time) {
    MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);
    if (label != null) slot.setLabel(label);
    if (time != null) slot.setTime(time);
    mealSlotRepository.save(slot);

    List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
    List<MealFood> allItems = options.stream()
        .flatMap(o -> mealFoodRepository.findByOptionIdOrderBySortOrder(o.getId()).stream())
        .toList();
    return MealSlotResponse.from(slot, options, allItems);
}
```

### WR-03: `withSaveStatus` helper uses `onMutate` but mutations that spread it also define their own `onMutate`

**File:** `frontend/src/stores/planStore.ts:45-63` and `109-118`

**Issue:** Several mutation hooks (e.g., `useAddMealSlot`, `useDeleteMealSlot`, `useAddExtra`, `useUpdateExtra`, `useDeleteFoodItem`) spread `...withSaveStatus(queryClient, patientId)` which defines `onMutate`, `onError`, and `onSettled`. However, `withSaveStatus.onMutate` only sets the save status to 'saving' — it does NOT return a context for rollback. Meanwhile, `useUpdatePlan` and `useAddFoodItem` implement proper optimistic updates with context. For `useDeleteFoodItem` and `useDeleteMealSlot`, there's no optimistic update — the cache only refreshes after `onSettled`. This means the UI won't reflect deletions until the server confirms, causing a perceived lag. It's inconsistent with the `useUpdatePlan`/`useAddFoodItem` patterns that show instant feedback.

**Fix:** Add optimistic updates for delete mutations. For example, `useDeleteFoodItem` should:
```typescript
onMutate: ({ mealId, optionId, itemId }) => {
    usePlanUIStore.getState().setSaveStatus('saving');
    const previousPlan = queryClient.getQueryData<MealPlan>(['plan', patientId]);
    if (previousPlan) {
      // Remove item optimistically from cache
      const updated = { ...previousPlan, meals: previousPlan.meals.map(m => {
        if (m.id !== mealId) return m;
        return { ...m, options: m.options.map(o => {
          if (o.id !== optionId) return o;
          return { ...o, items: o.items.filter(it => it.id !== itemId) };
        })};
      })};
      queryClient.setQueryData(['plan', patientId], updated);
    }
    return { previousPlan };
},
```

### WR-04: `PlanFoodRow` fires `onQtyChange` and `onPrepChange` on every keystroke, not on blur

**File:** `frontend/src/components/plan/PlanFoodRow.tsx:94-105`

**Issue:** The "Quantidade" (qty) and "Preparo" (prep) editable inputs use `onChange` to call `onQtyChange`/`onPrepChange` immediately on every keystroke. These callbacks trigger `updateFoodItem.mutate(...)` in PlansView — meaning every keystroke sends a PATCH request to the backend. For a user typing "1 colher de sopa", that's 16+ API calls in rapid succession. The "Gramas" field correctly uses `onBlur`. Qty and prep fields should also use `onBlur` for the API call, or implement debouncing.

**Fix:** Change the qty and prep inputs to call the parent handler only on blur, matching the grams input pattern:
```tsx
// For qty:
<input
  defaultValue={item.qty}
  onBlur={(e) => onQtyChange(e.target.value)}
  style={cellStyle('var(--fg-muted)', false)}
/>
// For prep:
<input
  defaultValue={item.prep}
  onBlur={(e) => onPrepChange(e.target.value)}
  style={cellStyle('var(--fg-muted)', false)}
/>
```
Note: switching from `value`/`onChange` to `defaultValue`/`onBlur` is needed to allow free typing without re-render from optimistic state.

### WR-05: `ExtrasSection` fires `onUpdateExtra` on every keystroke for name/quantity fields

**File:** `frontend/src/components/plan/ExtrasSection.tsx:13-19`

**Issue:** Same issue as WR-04. The `onChange` handler in the `inp()` helper function calls `onUpdateExtra` on every keystroke for the name and quantity fields. Since the handler distinguishes name/qty from numeric fields, name and quantity properly send string values, but this still results in a PATCH request per keystroke, which is excessive for free-text editing.

**Fix:** Only call `onUpdateExtra` on blur, not on every change:
```tsx
onChange={(ev) => {
  // Update local state only (would need to manage local state)
}},
onBlur={(ev) => {
  const isNameOrQty = key === 'name' || key === 'quantity';
  const numVal = Number(ev.target.value) || 0;
  onUpdateExtra(extraId, { [key]: isNameOrQty ? ev.target.value : numVal });
  ev.target.style.borderColor = 'transparent';
}},
```
This requires converting from controlled to uncontrolled inputs or managing local edit state.

### WR-06: `AddFoodModal` approximate macro preview calculation differs from backend formula

**File:** `frontend/src/components/plan/AddFoodModal.tsx:73-78`

**Issue:** The macro preview calculation uses `Math.round((per100 * g) / 10) / 10` which is equivalent to `per100 * grams / 100` rounded to 1 decimal. The backend uses `BigDecimal` with `HALF_UP` rounding, scale=1. While the results will usually match, the frontend formula `Math.round(x / 10) / 10` uses banker's rounding (JavaScript `Math.round` rounds 0.5 up always, while `HALF_UP` in BigDecimal also rounds 0.5 up, so they match for positive numbers). However, the comment says "approximate" so this is acceptable by design. Flagging as a warning because for values at exactly X.05 boundaries, the rounding could differ. E.g., 130.05 * 200 / 100 = 260.1, both match. But 130.25 * 200 / 100 = 260.5 → JS round to 261, BigDecimal HALF_UP also 261. Matches. Not practically problematic but worth noting.

**Fix:** No fix needed given the "approximate" disclaimer. Could add a more precise formula using `Math.round(per100 * grams) / 100` for closer match:
```typescript
kcal: Math.round(selected.per100.kcal * g * 10) / 10,  // matches HALF_UP scale=1
```

### WR-07: `Food.type` is stored as plain String, no enum validation

**File:** `backend/src/main/java/com/nutriai/api/model/Food.java:37` and `backend/src/main/java/com/nutriai/api/dto/food/CreateFoodRequest.java:12`

**Issue:** The `Food.type` field is a `String` with a DB CHECK constraint (`type IN ('BASE', 'PRESET')`), but the Java entity and DTO use raw `String`. If an invalid value bypasses the DB (e.g., in-memory operations, H2 test profile without Flyway), it could cause `String` comparison issues in `MealPlanService.addFoodItem` which checks `"BASE".equals(food.getType())`. This is partially mitigated by the DB constraint, but a Java enum would provide compile-time safety.

**Fix:** Define a `FoodType` enum and use `@Enumerated(EnumType.STRING)` on the entity:
```java
public enum FoodType { BASE, PRESET }

@Column(nullable = false)
@Enumerated(EnumType.STRING)
private FoodType type;
```
Then the service check becomes `food.getType() == FoodType.BASE`.

### WR-08: `reactivatePatient` creates new episode but doesn't create a default meal plan

**File:** `backend/src/main/java/com/nutriai/api/service/PatientService.java:141-156`

**Issue:** When `createPatient` is called, it auto-creates a 6-meal default plan via `mealPlanService.createDefaultPlan(...)`. However, when `reactivatePatient` is called, it creates a new `Episode` but does NOT create a default plan for that new episode. This means the patient will have an active episode with no meal plan, causing `getPlan` to throw a `ResourceNotFoundException("Plano alimentar", episode.getId())`.

**Fix:** Add the auto-creation call in `reactivatePatient`:
```java
public PatientResponse reactivatePatient(UUID id, UUID nutritionistId) {
    Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
            .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
    patient.reactivate();
    Episode episode = Episode.builder().patientId(patient.getId()).build();
    Episode savedEpisode = episodeRepository.save(episode);
    // D-13/D-14: Auto-create default 6-meal plan for new episode
    mealPlanService.createDefaultPlan(savedEpisode.getId(), nutritionistId);
    Patient updated = patientRepository.save(patient);
    return PatientResponse.from(updated);
}
```

## Info

### IN-01: Typo "vinculqado" in EditFoodModal

**File:** `frontend/src/components/plan/EditFoodModal.tsx:64`

**Issue:** The text reads "Alimento vinculqado ao catálogo" — there's a typo ("vinculqado" should be "vinculado").

**Fix:** Change to `"Alimento vinculado ao catálogo"`.

### IN-02: `FoodListApiResponse` type shape mismatch with backend `FoodListResponse`

**File:** `frontend/src/types/food.ts:81-89`

**Issue:** The frontend `FoodListApiResponse` expects `{ success: boolean; data: { content, page, size, total } }` with `total` as a number. The backend `FoodService.FoodListResponse` record uses `totalElements` and `totalPages`. The mapping in `useFoodCatalog()` accesses `response.data.total` which doesn't match the backend field `totalElements`. This currently works only if the `ApiResponse` wrapper renames the field, but looking at the backend code, the raw `FoodListResponse` has `totalElements` not `total`. The `ApiResponse.ok(response)` wraps it as `data: { content, page, size, totalElements, totalPages }`, meaning `response.data.total` would be `undefined`.

**Fix:** Either (a) rename the backend field to match the frontend:
```java
public record FoodListResponse(
    List<FoodResponse> content,
    int page,
    int size,
    long total,    // renamed from totalElements
    int totalPages
) { ... }
```
Or (b) update frontend to use `totalElements`:
```typescript
total: response.data.totalElements,
```

### IN-03: `PlanFoodRow` uses `value` (controlled) for grams input but reads on blur — state inconsistency risk

**File:** `frontend/src/components/plan/PlanFoodRow.tsx:97-102`

**Issue:** The grams input uses `value={String(item.grams)}` (controlled) but fires `onGramsBlur` on blur. When the user changes the grams value and blurs, the auto-save triggers an optimistic update that changes `item.grams` in the cache, causing a re-render. This works but if the server rejects the update, the value reverts. However, while the user is typing, the component re-renders on every parent state change, which could cause the cursor to jump if the parent re-renders for another reason (e.g., save status changes).

**Fix:** Consider using `defaultValue` for the grams input too, with a local state ref pattern:
```tsx
const [localGrams, setLocalGrams] = useState(String(item.grams));
// Reset local when item.grams changes from outside
useEffect(() => { setLocalGrams(String(item.grams)); }, [item.grams]);
```

### IN-04: `PlansView.exportPDF` opens a window with inline HTML — minor XSS consideration

**File:** `frontend/src/views/PlansView.tsx:196-262`

**Issue:** The `exportPDF` function creates a new browser window and writes HTML using `doc.write()` and `doc.createElement()`. Food names (`it.foodName`) and other user-controlled data are set via `textContent`, which is safe — `textContent` does not parse HTML. The inline CSS is all hardcoded. This is safe against XSS since user data is only inserted via DOM APIs (`textContent`, `createElement`), not via `innerHTML`. No fix needed — flagging for awareness.

### IN-05: Unused import `Collectors` in MealSlotResponse

**File:** `backend/src/main/java/com/nutriai/api/dto/plan/MealSlotResponse.java:9`

**Issue:** `import java.util.stream.Collectors;` is imported but never used (the code uses `.toList()` which is a Stream method, not Collectors).

**Fix:** Remove the unused import:
```java
// Remove: import java.util.stream.Collectors;
```

### IN-06: `App.tsx` declares `queryClient` after the component that uses it

**File:** `frontend/src/App.tsx:86-94`

**Issue:** The `queryClient` constant is declared at line 94 (bottom of file), after the `App` component at line 86 which references it in `<QueryClientProvider client={queryClient}>`. Due to JavaScript hoisting of `const` declarations (they're hoisted but not initialized), this works at runtime because `App()` is called after module initialization completes. However, it's unconventional and could confuse readers.

**Fix:** Move `queryClient` declaration above the `App` component:
```typescript
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

_Reviewed: 2026-04-22T12:30:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_