#!/bin/bash
# 低速续跑：每日两次，30 秒/段，配额恢复后逐步完成
cd ~/projects/guanshi
python3 /mnt/c/Users/W/AppData/Local/Temp/gs3/gen-audio.py >> /tmp/gen-audio-task.log 2>&1
