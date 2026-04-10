#!/bin/bash
URL="${1:-https://criativalia-runtime.onrender.com/api/stats}"

# Curl with timing info, capturing HTTP code and total time
RESULT=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" \
  --max-time 30 \
  --connect-timeout 10 \
  "$URL" 2>&1)

CURL_EXIT=$?

# Handle curl failures (timeout, connection error, DNS failure, etc.)
if [ $CURL_EXIT -ne 0 ]; then
  case $CURL_EXIT in
    6)  ERR_MSG="Could not resolve host" ;;
    7)  ERR_MSG="Failed to connect" ;;
    28) ERR_MSG="Request timeout (>30s)" ;;
    35) ERR_MSG="SSL/TLS handshake failed" ;;
    *)  ERR_MSG="Curl error code: $CURL_EXIT" ;;
  esac
  echo "❌ KEEP-ALIVE FAILED: $URL"
  echo "   Error: $ERR_MSG"
  echo "   Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  exit 1
fi

# Parse result: HTTP_CODE,TIME_TOTAL
HTTP_CODE=$(echo "$RESULT" | cut -d',' -f1)
TIME_TOTAL=$(echo "$RESULT" | cut -d',' -f2)

# Check if HTTP code is 2xx
if ! echo "$HTTP_CODE" | grep -qE '^2[0-9]{2}$'; then
  echo "⚠️ KEEP-ALIVE WARNING: $URL"
  echo "   HTTP Status: $HTTP_CODE (expected 2xx)"
  echo "   Response Time: ${TIME_TOTAL}s"
  echo "   Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  exit 1
fi

# Success - exit silently (no output)
exit 0