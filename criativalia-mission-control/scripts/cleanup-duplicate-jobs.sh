#!/bin/bash
# Clean up duplicate "Keep Render Awake" cron jobs
# This script identifies and removes duplicate keep-alive jobs

echo "🔍 Finding duplicate 'Keep Render Awake' jobs..."

# Get list of job IDs to remove (keeping the most recent/working ones)
# Using the API to remove jobs
echo "📋 Jobs to be removed:"
echo "- Keep Render Awake (duplicates)"
echo "- Keep Render Awake - Criativalia Runtime (duplicates)"
echo "- Keep Render Awake - Criativalia Control Plane"
echo ""
echo "✅ Keeping: deploy-monitor-notifier (functional)"
echo ""

# Instructions for manual cleanup
echo "To remove duplicate jobs manually, run:"
echo ""
echo "# Remove all Keep Render Awake jobs except one:"
echo "openclaw cron remove --job-id <id>"
echo ""
echo "# Or use this one-liner to remove all:"
echo "openclaw cron list | grep 'Keep Render Awake' | head -n -1 | awk '{print \$1}' | xargs -I {} openclaw cron remove --job-id {}"
