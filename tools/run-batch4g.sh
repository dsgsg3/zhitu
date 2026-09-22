#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4g.mjs > /tmp/batch4g.json 2>/tmp/batch4g.err
echo "exit=$?"
wc -c /tmp/batch4g.json
