#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4e.mjs > /tmp/batch4e.json 2>/tmp/batch4e.err
echo "exit=$?"
wc -c /tmp/batch4e.json
