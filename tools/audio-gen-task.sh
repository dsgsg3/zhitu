#!/bin/bash
# 低速续跑：每日两次（Windows 计划任务 GuanshiAudioGen-Day 10:00 / -Night 22:00）
# 慢速模式由 tools/.gen-slow 标志文件开启；生成器自带单实例锁，上一轮未结束时本轮自动跳过。
cd "$(dirname "$0")/.." || exit 1
python3 tools/gen-audio.py >> /tmp/gen-audio-task.log 2>&1
