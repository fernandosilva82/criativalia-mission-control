. /root/.openclaw/extensions/openclaw-lark/auth.sh 2>/dev/null || true

mkdir -p /root/.openclaw/workspace/criativalia/timesheets/$(date +%Y%m%d)
mkdir -p /root/.openclaw/workspace/criativalia/evidencias/$(date +%Y%m%d)

yesterday=$(date -d yesterday +%Y%m%d 2>/dev/null || date -v-1d +%Y%m%d 2>/dev/null || echo $(date +%Y%m%d))
mkdir -p /root/.openclaw/workspace/criativalia/evidencias/$yesterday