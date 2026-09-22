#!/bin/bash
cd ~/projects/guanshi
grep -h "id: '" src/data/*.js | grep -E "russian|may|industrial|ussr|oracle|marx|lu-xun|shang|zhou" | head -20
echo ===
grep -h -A2 "id: 'marx'" src/data/figures.js | head -8
echo ===
grep -h -A2 "id: 'lu-xun'" src/data/figures.js | head -8
echo ===
sed -n '1,80p' tools/validate-data.mjs
