#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4mini.mjs > /tmp/batch4mini.json 2>/tmp/batch4mini.err
echo "exit=$?"
cat /tmp/batch4mini.json
