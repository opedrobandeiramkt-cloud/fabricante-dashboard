#!/bin/sh
set -e

echo "=== iGUi Backend Startup ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO - CONFIGURE NO RAILWAY!')"
echo "FRONTEND_URL: ${FRONTEND_URL:-não configurado}"
echo "============================"

exec node dist/server.js
