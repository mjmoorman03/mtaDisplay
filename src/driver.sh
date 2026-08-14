#!/usr/bin/env bash

#run from root of repo

. ./.venv/bin/activate

while true
do 
    npx tsx src/mtaTrainTimes.ts
    python3 src/display.py
    sleep 5
done
