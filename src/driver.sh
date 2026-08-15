#!/usr/bin/env bash

# kills the $CHILD_PID process when run
cleanup() {
    kill "$CHILD_PID" 2>/dev/null
}
trap cleanup EXIT SIGINT SIGTERM

# python child background process to continuously paint screen anew
(
    . ./.venv/bin/activate
    python3 src/display.py
    
) &
CHILD_PID=$!

# parent process, fetches continuously
while true
do 
    npx tsx src/mtaTrainTimes.ts
    sleep 25
done
