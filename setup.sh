#!/usr/bin/env bash
# Installs what the North Pole map needs. Safe to run more than once.
set -eo pipefail

echo "Installing dependencies with npm ci"
npm ci
