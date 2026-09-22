#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4micro2.mjs > /tmp/batch4micro2.json 2>/tmp/batch4micro2.err
echo "exit=$?"
cat /tmp/batch4micro2.json
