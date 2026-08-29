#!/bin/bash
set -euo pipefail

# Reconcile dependencies introduced by merged tasks, then catch integration
# errors before the application workflow is restarted.
npm install --no-audit --no-fund
npm run check
npm run build