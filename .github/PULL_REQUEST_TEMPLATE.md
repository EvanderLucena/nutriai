## Summary

<!-- Brief description of what this PR does and why -->

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Infra/Tooling
- [ ] Docs

## Affected Area

- [ ] Frontend (`frontend/`)
- [ ] Backend (`backend/`)
- [ ] Both
- [ ] CI/CD (`.github/`, `docker/`)

## Checklist — Frontend (if checked above)

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] Zustand `partialize` includes `accessToken` (if auth store changed)
- [ ] All UI text is pt-BR
- [ ] Accessible: labels, focus, keyboard nav

## Checklist — Backend (if checked above)

- [ ] `./gradlew compileJava` passes
- [ ] `./gradlew check` passes (tests + checkstyle + JaCoCo)
- [ ] New endpoints have `@PreAuthorize("hasRole('NUTRITIONIST')")`
- [ ] Every DB query scopes by `nutritionistId` (tenant isolation)
- [ ] Flyway migration added (if schema changed)
- [ ] No sensitive data in logs (passwords, tokens, health data)

## Notes

<!-- Anything the AI reviewer should know? Context that helps review. -->