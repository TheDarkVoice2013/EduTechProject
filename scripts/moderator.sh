#!/usr/bin/env bash
set -euo pipefail
cd /opt/edutechproject
if [[ $# -lt 2 || $# -gt 3 ]]; then
  printf 'Usage: sudo bash scripts/moderator.sh create|reset USERNAME [moderator|admin]\n' >&2
  exit 1
fi
read -r -s -p 'New moderator password (at least 14 characters): ' moderator_password
printf '\n'
read -r -s -p 'Confirm password: ' moderator_confirmation
printf '\n'
if [[ "$moderator_password" != "$moderator_confirmation" ]]; then
  printf 'Passwords do not match. Nothing changed.\n' >&2
  exit 1
fi
printf '%s' "$moderator_password" | runuser -u edutechproject -- env DATA_DIR=/var/lib/edutechproject /opt/edutechproject-runtime/bin/node server/admin.mjs "$@"
unset moderator_password moderator_confirmation
