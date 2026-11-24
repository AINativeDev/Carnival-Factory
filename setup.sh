#!/usr/bin/env bash
# Installs what the North Pole map needs. Safe to run more than once.
set -eo pipefail

echo "Machine: $(nproc 2>/dev/null || echo ?) CPUs, $(awk '/MemTotal/ {printf "%.0f", $2/1048576}' /proc/meminfo 2>/dev/null || echo ?) GB memory"
echo "Installing dependencies with npm ci"
npm ci --prefer-offline --no-audit --no-fund
