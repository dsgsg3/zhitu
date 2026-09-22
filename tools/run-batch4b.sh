#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4b.mjs > /tmp/batch4b.json 2>/tmp/batch4b.err
echo "exit=$?"
wc -c /tmp/batch4b.json
