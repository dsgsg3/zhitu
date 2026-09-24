#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4f.mjs > /tmp/batch4f.json 2>/tmp/batch4f.err
echo "exit=$?"
wc -c /tmp/batch4f.json
