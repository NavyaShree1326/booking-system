#!/usr/bin/env bash
# supabase/functions/send-booking-email/test_send.sh
# Usage:
#   SUPABASE_FUNCTION_URL="https://<project>.functions.supabase.co/send-booking-email" \
#   ./supabase/functions/send-booking-email/test_send.sh
# Or set SUPABASE_FUNCTION_URL env var and run.

set -euo pipefail

FUNCTION_URL=${SUPABASE_FUNCTION_URL:-}
if [ -z "$FUNCTION_URL" ]; then
  echo "Please set SUPABASE_FUNCTION_URL environment variable to your function URL"
  echo "Example: export SUPABASE_FUNCTION_URL='https://xyz.functions.supabase.co/send-booking-email'"
  exit 1
fi

payload=$(cat <<'JSON'
{
  "type": "booking_created",
  "booking": {
    "id": "test-123",
    "title": "Test booking",
    "description": "Test booking description",
    "start_time": "2026-01-28T15:00:00.000Z",
    "end_time": "2026-01-28T15:30:00.000Z",
    "location": "Online",
    "meeting_link": "https://meet.example/abc"
  },
  "attendees": [
    { "email": "you@example.com", "full_name": "Test User" }
  ]
}
JSON
)

echo "Calling $FUNCTION_URL"

curl -i -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "$payload" | jq '.' || true

exit 0
