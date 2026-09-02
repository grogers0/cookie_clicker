#!/bin/bash

set -euo pipefail

MODS_LOCAL_PATH="/mnt/c/Program Files (x86)/Steam/steamapps/common/Cookie Clicker/resources/app/mods/local"

if [ "$#" -lt 1 ]; then
    echo "error: pass the files to steamify as arguments" >&2
    exit 1
fi

for filename in "$@"; do
    if [[ ! "$filename" =~ \.js$ ]]; then
        echo "error: filename \"${filename}\" must end in .js" >&2
        exit 1
    fi
done


for filename in "$@"; do
    modname="${filename%.js}"
    echo "$modname"
    mkdir -p "$MODS_LOCAL_PATH/$modname"
    cp "$filename" "$MODS_LOCAL_PATH/$modname/main.js"
    cp "steam/$modname.info.txt" "$MODS_LOCAL_PATH/$modname/info.txt"
done
