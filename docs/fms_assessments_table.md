# FMS Assessments Table Documentation

The FMS (Functional Movement Screen) assessments table stores evaluation data for client movement patterns.

## Table Structure

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key, auto-generated |
| user_id | UUID | Foreign key to auth.users, identifies the assessed user |
| date | DATE | Date when the assessment was conducted |
| deep_squat | INTEGER | Score for Deep Squat movement (0-3) |
| hurdle_step | INTEGER | Score for Hurdle Step movement (0-3) |
| inline_lunge | INTEGER | Score for Inline Lunge movement (0-3) |
| shoulder_mobility | INTEGER | Score for Shoulder Mobility movement (0-3) |
| active_straight_leg_raise | INTEGER | Score for Active Straight Leg Raise movement (0-3) |
| trunk_stability_pushup | INTEGER | Score for Trunk Stability Pushup movement (0-3) |
| rotary_stability | INTEGER | Score for Rotary Stability movement (0-3) |
| total_score | INTEGER | Auto-calculated sum of all movement scores (0-21) |
| notes | TEXT | Additional notes about the assessment |
| created_at | TIMESTAMPTZ | Auto-generated creation timestamp |
| updated_at | TIMESTAMPTZ | Auto-generated update timestamp |

## Scoring System

- **0**: Pain during movement
- **1**: Unable to complete movement pattern
- **2**: Completes movement with compensation
- **3**: Perfect form, no compensation

## Total Score Interpretation

- **14-21**: Good functional movement
- **10-13**: Acceptable movement patterns, may benefit from targeted correctives
- **<10**: Poor movement patterns, high risk of injury, needs corrective strategies

## Row Level Security

Access to this table is secured through Row Level Security (RLS) policies:

1. Users can only view their own assessment records
2. Users can only insert assessment records for themselves
3. Users can only update their own assessment records
4. Users can only delete their own assessment records

## Usage in Application

The table is primarily used by the FMS Assessment page to:
1. Record movement pattern evaluations
2. Track movement quality over time
3. Identify mobility/stability limitations
4. Guide corrective exercise programming
