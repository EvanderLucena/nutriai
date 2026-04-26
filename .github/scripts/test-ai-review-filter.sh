#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/ai-review.sh"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

run_filter() {
  local findings_content="$1"
  local diff_content="$2"
  local manifest_content="${3:-}"

  printf '%s\n' "${findings_content}" > "${TMP_DIR}/findings.txt"
  printf '%s\n' "${diff_content}" > "${TMP_DIR}/diff.txt"
  printf '%s\n' "${manifest_content}" > "${TMP_DIR}/manifest.txt"

  filter_false_positives "${TMP_DIR}/findings.txt" "${TMP_DIR}/diff.txt" "${TMP_DIR}/manifest.txt"
}

assert_empty() {
  local file_path="$1"
  local message="$2"

  if [[ -s "${file_path}" ]]; then
    echo "FAIL: ${message}" >&2
    cat "${file_path}" >&2
    exit 1
  fi
}

assert_contains() {
  local file_path="$1"
  local pattern="$2"
  local message="$3"

  if ! grep -qE "${pattern}" "${file_path}"; then
    echo "FAIL: ${message}" >&2
    cat "${file_path}" >&2
    exit 1
  fi
}

run_filter \
  "- HIGH: Shared state from beforeAll can leak between tests." \
  $'+beforeEach(() => {\n+  resetState();\n+})'
assert_empty "${TMP_DIR}/findings.txt" "beforeAll/shared-state false positive should be dropped when diff only has beforeEach"

run_filter \
  "- HIGH: Shared state from beforeAll can leak between tests." \
  $'+beforeAll(() => {\n+  seedSharedFixture();\n+})'
assert_contains "${TMP_DIR}/findings.txt" 'beforeAll' "beforeAll finding should stay when beforeAll is visible in the diff"

run_filter \
  "- HIGH: If another layer reuses this response, it may expose stale data." \
  $'+const value = buildResponse();'
assert_empty "${TMP_DIR}/findings.txt" "anchorless speculative finding should be dropped"

run_filter \
  "- HIGH: If updateAssessment() accepts a foreign patientId, it can mutate another patient route." \
  $'+assessmentService.updateAssessment(patientId, assessmentId, request);'
assert_contains "${TMP_DIR}/findings.txt" 'updateAssessment\(\)' "speculative wording with a concrete anchor should remain"

# Rule 8 — compilation error claims are unverifiable from diff alone.
run_filter \
  "- CRITICAL: Em PatientService.java falta declaracao da variavel, gerando erro de compilacao." \
  $'+Episode savedEpisode = episodeRepository.save(episode);'
assert_empty "${TMP_DIR}/findings.txt" "compilation-error claims should be dropped (CI catches real ones)"

run_filter \
  "- CRITICAL: MealPlanService chama EpisodeHistoryEvent.builder() mas a classe nao foi importada, provocando falha de compilacao." \
  $'+import com.nutriai.api.model.EpisodeHistoryEvent;\n+historyEventRepository.save(EpisodeHistoryEvent.builder()...)'
assert_empty "${TMP_DIR}/findings.txt" "compilation-error claims with 'falha de compilacao' wording should be dropped"

# Rule 9 — claims about "X never declared/imported" are dropped when X appears in the diff.
run_filter \
  "- CRITICAL: A variavel \`savedEpisode\` nunca e declarada no metodo." \
  $'+Episode savedEpisode = episodeRepository.save(episode);\n+historyEventRepository.save(event);'
assert_empty "${TMP_DIR}/findings.txt" "symbol-not-declared claim should be dropped when symbol is assigned in diff"

run_filter \
  "- HIGH: Classe \`EpisodeHistoryEvent\` nao importada, gerando classe nao encontrada." \
  $'+import com.nutriai.api.model.EpisodeHistoryEvent;'
assert_empty "${TMP_DIR}/findings.txt" "missing-import claim should be dropped when import line is in diff"

run_filter \
  "- CRITICAL: A variavel \`reallyMissingVar\` nunca e declarada." \
  $'+const otherVar = 1;'
assert_contains "${TMP_DIR}/findings.txt" 'reallyMissingVar' "symbol-not-declared claim should remain when symbol is genuinely absent from diff"

echo "ai-review filter regression checks passed"
