#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4d.mjs > /tmp/batch4d.json 2>/tmp/batch4d.err
echo "exit=$?"
wc -c /tmp/batch4d.json
