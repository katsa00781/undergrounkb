# FMS Assessment Implementation

## Overview

This document outlines the implementation of the Functional Movement Screen (FMS) assessment feature, which allows trainers to evaluate client movement patterns and track their functional movement quality.

## Changes Made

1. **Database Migration**
   - Created the `fms_assessments` table in Supabase
   - Added computed `total_score` field that automatically sums the seven movement scores
   - Implemented Row Level Security (RLS) policies to secure data

2. **TypeScript Definitions**
   - Added `fms_assessments` table definition to `/src/types/supabase.ts`
   - Ensured type safety throughout the application

3. **FMS Library Functions**
   - Enhanced error handling and logging in `/src/lib/fms.ts`
   - Improved data formatting for the database operations

4. **FMS Assessment Component**
   - Fixed type issues in `/src/pages/FMSAssessment.tsx`
   - Added better error handling and logging
   - Improved user feedback during the assessment process

5. **Testing and Verification**
   - Created test scripts to verify table creation and functionality
   - Documented table structure and scoring system

## How to Deploy

1. **Apply Database Migration**
   ```bash
   # From project root
   ./apply-fms-migration.sh
   ```
   
   This will apply the migration script that creates the `fms_assessments` table with proper constraints and RLS policies.

2. **Verify Table Creation**
   ```bash
   # From project root
   npx ts-node scripts/check-fms-table.ts
   ```
   
   This will verify that the table was created successfully.

3. **Test Functionality**
   ```bash
   # From project root
   npx ts-node scripts/test-fms-functionality.ts
   ```
   
   This will attempt to create a test assessment and retrieve it to verify the functionality.

## Table Structure

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| date | DATE | Date of assessment |
| deep_squat | INTEGER | Score (0-3) |
| hurdle_step | INTEGER | Score (0-3) |
| inline_lunge | INTEGER | Score (0-3) |
| shoulder_mobility | INTEGER | Score (0-3) |
| active_straight_leg_raise | INTEGER | Score (0-3) |
| trunk_stability_pushup | INTEGER | Score (0-3) |
| rotary_stability | INTEGER | Score (0-3) |
| total_score | INTEGER | Computed sum (0-21) |
| notes | TEXT | Optional comments |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

## Scoring System

- **0**: Pain during movement
- **1**: Unable to complete movement pattern
- **2**: Completes movement with compensation
- **3**: Perfect form, no compensation

## Troubleshooting

If you encounter any issues:

1. Check if the `fms_assessments` table exists in Supabase
2. Verify that the RLS policies are properly configured
3. Look for errors in the browser console
4. Check that the TypeScript types match the database schema
