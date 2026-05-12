#!/bin/bash
#
# Claude Code Hook: git commit 시 ~/.gitconfig의 author 정보를 강제 적용
#
# PreToolUse (Bash) 이벤트에서 실행되며,
# git commit 명령에 --author 플래그가 없으면 글로벌 gitconfig 기반으로 추가합니다.

set -euo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# git commit 명령이 아니면 통과
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit\b|&&\s*git\s+commit\b|;\s*git\s+commit\b'; then
  exit 0
fi

# 이미 --author 플래그가 있으면 통과
if echo "$COMMAND" | grep -q '\-\-author'; then
  exit 0
fi

# 글로벌 gitconfig에서 user 정보 읽기
GIT_USER_NAME=$(git config --global user.name 2>/dev/null || true)
GIT_USER_EMAIL=$(git config --global user.email 2>/dev/null || true)

if [ -z "$GIT_USER_NAME" ] || [ -z "$GIT_USER_EMAIL" ]; then
  echo "Warning: ~/.gitconfig에 user.name 또는 user.email이 설정되지 않았습니다." >&2
  exit 0
fi

# git commit 명령에 --author 플래그 추가
AUTHOR_FLAG="--author=\"${GIT_USER_NAME} <${GIT_USER_EMAIL}>\""
MODIFIED_COMMAND=$(echo "$COMMAND" | sed "s/git commit/git commit ${AUTHOR_FLAG}/")

# updatedInput으로 수정된 명령 반환
jq -n \
  --arg cmd "$MODIFIED_COMMAND" \
  --argjson original_input "$(echo "$INPUT" | jq '.tool_input')" \
  '{
    "hookSpecificOutput": {
      "permissionDecision": "allow",
      "updatedInput": ($original_input | .command = $cmd)
    }
  }'
