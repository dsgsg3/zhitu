#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4a.mjs > /tmp/batch4a.json 2>/tmp/batch4a.err
echo "exit=$?"
wc -c /tmp/batch4a.json
