#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4c.mjs > /tmp/batch4c.json 2>/tmp/batch4c.err
echo "exit=$?"
wc -c /tmp/batch4c.json
