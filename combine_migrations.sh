#!/bin/bash

OUTPUT_FILE="/tmp/cc-agent/62550860/project/belleya_schema_complete.sql"

echo "/*" > "$OUTPUT_FILE"
echo " * BELLEYA DATABASE SCHEMA - COMPLETE MIGRATION" >> "$OUTPUT_FILE"
echo " * Generated: $(date)" >> "$OUTPUT_FILE"
echo " * " >> "$OUTPUT_FILE"
echo " * This script contains the complete database schema for Belleya." >> "$OUTPUT_FILE"
echo " * It includes all tables, triggers, functions, RLS policies, and indexes." >> "$OUTPUT_FILE"
echo " * " >> "$OUTPUT_FILE"
echo " * IMPORTANT: This is a SCHEMA-ONLY migration. No user data is included." >> "$OUTPUT_FILE"
echo " * " >> "$OUTPUT_FILE"
echo " * Execute this script on a fresh Supabase project." >> "$OUTPUT_FILE"
echo " */" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Disable triggers during migration" >> "$OUTPUT_FILE"
echo "SET session_replication_role = replica;" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for file in /tmp/cc-agent/62550860/project/supabase/migrations/*.sql; do
    filename=$(basename "$file")
    echo "" >> "$OUTPUT_FILE"
    echo "-- ============================================================================" >> "$OUTPUT_FILE"
    echo "-- Migration: $filename" >> "$OUTPUT_FILE"
    echo "-- ============================================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "-- Re-enable triggers" >> "$OUTPUT_FILE"
echo "SET session_replication_role = DEFAULT;" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Migration completed successfully" >> "$OUTPUT_FILE"

echo "Migration script created: $OUTPUT_FILE"
