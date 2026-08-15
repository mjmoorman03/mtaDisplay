#!/usr/bin/env bash

# Function to clean up background processes
cleanup() {
    # Kill the specific child PID if it exists
    if [ -n "$CHILD_PID" ]; then
        kill "$CHILD_PID" 2>/dev/null
    fi
    
    # Backup: Kill any remaining python3 processes started by this script's process group
    pkill -P $$ -f "python3 src/display.py" 2>/dev/null
    exit 0
}

# Trap signals and direct them to cleanup
trap cleanup EXIT SIGINT SIGTERM

# Run python directly without an extra subshell wrapper
# This ensures $! gets the exact PID of the python process instantly
. ./.venv/bin/activate
python3 src/display.py &
CHILD_PID=$!

# parent process, fetches continuously
while true
do 
    npx tsx src/mtaTrainTimes.ts
    sleep 25
done
