#!/bin/bash

# Check Cloud SQL instance status
echo "Checking Cloud SQL instance status..."

while true; do
    STATUS=$(gcloud sql instances describe vssyl-db --format="value(state)" 2>/dev/null)
    
    if [ "$STATUS" = "RUNNABLE" ]; then
        echo "✅ Database is ready!"
        break
    elif [ "$STATUS" = "PENDING_CREATE" ]; then
        echo "⏳ Database is still being created... (waiting 30 seconds)"
        sleep 30
    else
        echo "❌ Unexpected status: $STATUS"
        break
    fi
done

echo "Database status: $STATUS"
