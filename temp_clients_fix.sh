#!/bin/bash
# Create a temporary file with the corrected content
head -n 1050 /tmp/cc-agent/62550860/project/src/pages/Clients.tsx > /tmp/cc-agent/62550860/project/temp_clients.tsx
tail -n +1312 /tmp/cc-agent/62550860/project/src/pages/Clients.tsx >> /tmp/cc-agent/62550860/project/temp_clients.tsx
mv /tmp/cc-agent/62550860/project/temp_clients.tsx /tmp/cc-agent/62550860/project/src/pages/Clients.tsx
