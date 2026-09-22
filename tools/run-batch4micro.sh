#!/bin/bash
cd ~/projects/guanshi
node tools/fetch-batch4micro.mjs > /tmp/batch4micro.json 2>/tmp/batch4micro.err
echo "exit=$?"
cat /tmp/batch4micro.json
