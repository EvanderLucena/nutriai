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

echo "ai-review filter regression checks passed"
