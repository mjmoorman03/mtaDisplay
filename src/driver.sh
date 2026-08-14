#!/usr/bin/env bash

# we really should make this spawn two processes, or at least spawn one child
# such that we can have the api call fetch and write in the background
# every 30s or something
# and then we have the python one redisplay every 5 seconds
# (this is somewhat necessary bc the python code must be continuously 
#  running for the display to remain active)

. ./.venv/bin/activate

while true
do 
    npx tsx src/mtaTrainTimes.ts
    python3 src/display.py
    sleep 5
done
