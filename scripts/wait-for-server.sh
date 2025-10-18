#!/bin/bash
# Wait for Next.js server to be ready

MAX_ATTEMPTS=60
ATTEMPT=0

echo "Waiting for Next.js server at http://localhost:3000..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Server is ready!"
    exit 0
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - Server not ready yet..."
  sleep 1
done

echo "❌ Server did not become ready within $MAX_ATTEMPTS seconds"
exit 1
