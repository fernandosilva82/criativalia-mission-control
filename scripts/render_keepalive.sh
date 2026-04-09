: "${RENDER_URL:=https://criativalia-runtime.onrender.com/api/stats}"

# Perform the request with timing and capture output
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" -o - "$RENDER_URL" 2>&1)
EXIT_CODE=$?

# Extract status code and time
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS:/p' | head -n -1)

# Log to stderr for visibility (cron captures this)
echo "[$(date -Iseconds)] Render Ping: URL=$RENDER_STATUS, Status=$HTTP_STATUS, Time=${TIME_TOTAL}s" >&2

# Only output (which cron may email/message) if non-2xx or curl failed
if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ RENDER PING FAILED"
    echo "   URL: $RENDER_URL"
    echo "   Error: curl exited with code $EXIT_CODE"
    echo "   Response: $RESPONSE"
    exit 1
fi

if [ -z "$HTTP_STATUS" ] || [ "$HTTP_STATUS" -lt 200 ] || [ "$HTTP_STATUS" -ge 300 ]; then
    echo "⚠️ RENDER PING NON-2XX"
    echo "   URL: $RENDER_URL"
    echo "   Status: ${HTTP_STATUS:-unknown}"
    echo "   Time: ${TIME_TOTAL}s"
    echo "   Response: $BODY"
    exit 1
fi

# Success — silent exit (no output = no message)
exit 0
