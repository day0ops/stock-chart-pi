#!/bin/bash

# Display Scheduler
# Turns screen on 3 hours before market open and off 3 hours after market close
# US Stock Market Hours: 9:30 AM - 4:00 PM ET
# Screen on: 6:30 AM - 7:00 PM ET (Monday-Friday)

# Get current time in ET timezone
CURRENT_HOUR=$(TZ="America/New_York" date +%H)
CURRENT_MIN=$(TZ="America/New_York" date +%M)
CURRENT_DAY=$(TZ="America/New_York" date +%u)  # 1=Monday, 7=Sunday

# Convert to minutes since midnight for easier comparison
CURRENT_MINUTES=$((CURRENT_HOUR * 60 + CURRENT_MIN))

# Market hours with 3-hour buffer (in minutes since midnight)
SCREEN_ON_TIME=$((6 * 60 + 30))   # 6:30 AM ET
SCREEN_OFF_TIME=$((19 * 60))       # 7:00 PM ET

# Log file
LOG_FILE="$HOME/.display-scheduler.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

turn_screen_on() {
    # Wake display using caffeinate (sends user activity signal)
    caffeinate -u -t 2 &>/dev/null
    log "Screen turned ON (Market hours)"
}

turn_screen_off() {
    # Put display to sleep
    pmset displaysleepnow &>/dev/null
    log "Screen turned OFF (Outside market hours)"
}

# Check if it's a weekday (1-5 = Mon-Fri)
if [[ $CURRENT_DAY -ge 1 && $CURRENT_DAY -le 5 ]]; then
    # Weekday - check market hours
    if [[ $CURRENT_MINUTES -ge $SCREEN_ON_TIME && $CURRENT_MINUTES -lt $SCREEN_OFF_TIME ]]; then
        turn_screen_on
    else
        turn_screen_off
    fi
else
    # Weekend - screen off
    turn_screen_off
    log "Weekend - market closed"
fi
