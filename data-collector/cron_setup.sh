#!/bin/bash
# Cron setup script for stock data collection
# This script sets up cron jobs to run at 4:00 PM and 6:45 PM EST

# Get the absolute path to the collector script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_PATH=$(which python3)

echo "Setting up cron jobs for stock data collection..."
echo "Script directory: $SCRIPT_DIR"
echo "Python path: $PYTHON_PATH"

# Create a temporary cron file
CRON_TMP=$(mktemp)

# Get existing crontab
crontab -l > "$CRON_TMP" 2>/dev/null || true

# Remove any existing stock collector cron jobs
sed -i '/stock-volatility-app\/data-collector\/collector.py/d' "$CRON_TMP"

# Add new cron jobs
# 4:00 PM EST (21:00 UTC in winter, 20:00 UTC in daylight saving)
# 6:45 PM EST (23:45 UTC in winter, 22:45 UTC in daylight saving)
# Runs Monday-Friday (1-5)

cat >> "$CRON_TMP" << EOF

# Stock Data Collection - Market Close (4:00 PM EST)
0 21 * * 1-5 cd $SCRIPT_DIR && $PYTHON_PATH collector.py --time=close >> $SCRIPT_DIR/logs/close_\$(date +\%Y\%m\%d).log 2>&1

# Stock Data Collection - After Hours (6:45 PM EST)
45 23 * * 1-5 cd $SCRIPT_DIR && $PYTHON_PATH collector.py --time=afterhours >> $SCRIPT_DIR/logs/afterhours_\$(date +\%Y\%m\%d).log 2>&1
EOF

# Install the new crontab
crontab "$CRON_TMP"
rm "$CRON_TMP"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

echo ""
echo "✓ Cron jobs installed successfully!"
echo ""
echo "Schedule:"
echo "  - Market Close:  4:00 PM EST (Mon-Fri)"
echo "  - After Hours:   6:45 PM EST (Mon-Fri)"
echo ""
echo "Logs will be saved to: $SCRIPT_DIR/logs/"
echo ""
echo "To view installed cron jobs: crontab -l"
echo "To remove cron jobs: crontab -e (then delete the lines)"
echo ""

