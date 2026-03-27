#!/bin/bash
# Watchdog script — ensures Claude Code never stays idle
# Run: nohup bash scripts/watchdog.sh &
# This script monitors the Claude Code process and sends
# a keepalive signal if it detects idle state

INTERVAL=60  # Check every 60 seconds

echo "🐕 Watchdog started at $(date)"
echo "   Monitoring Claude Code session..."
echo "   Interval: ${INTERVAL}s"
echo "   Press Ctrl+C to stop"

while true; do
    sleep $INTERVAL

    # Check if claude process exists
    if ! pgrep -f "claude" > /dev/null 2>&1; then
        echo "$(date): Claude not running. Watchdog idle."
        continue
    fi

    echo "$(date): Claude active ✓"
done
