# Exercise Library Documentation

## Overview

The Exercise Library is a feature of UGKettlebell Pro that enables users to create, view, edit, and manage exercises. Each exercise has specific attributes like category, movement pattern, difficulty level, and instructions. The library serves as a foundation for creating workouts and training programs.

## Database Structure

The exercise library uses a PostgreSQL table with the following structure:

```sql
CREATE TABLE public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  category exercise_category NOT NULL,
  movement_pattern movement_pattern NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL
);
```

### Key Enums

#### Exercise Categories
The `exercise_category` enum includes:
- `strength_training`: General strength training exercises
- `cardio`: Cardiovascular exercises
- `kettlebell`: Kettlebell-specific exercises
- `mobility_flexibility`: Mobility and flexibility exercises
- `hiit`: High-Intensity Interval Training exercises
- `recovery`: Recovery and rehabilitation exercises

#### Movement Patterns
The `movement_pattern` enum includes various movement types, such as:
- Gait patterns (`gait_stability`, `gait_crawling`)
- Hip dominant movements (`hip_dominant_bilateral`, `hip_dominant_unilateral`)
- Knee dominant movements (`knee_dominant_bilateral`, `knee_dominant_unilateral`)
- Push/pull movements (horizontal and vertical variations)
- Stability exercises
- Corrective exercises
- And many others

## Component Structure

The exercise library implementation consists of several React components:

1. **ExerciseLibrary.tsx**: Main page component that orchestrates the entire library view
2. **ExerciseForm.tsx**: Form component for creating and editing exercises
3. **ExerciseCard.tsx**: Card component for displaying individual exercise details
4. **ExerciseFilter.tsx**: Filter component for searching and filtering exercises

## Service Layer

The exercise library interacts with the database through the `exerciseService.ts` service file, which provides the following functions:

- `getExercises()`: Fetch all exercises with optional filtering
- `getExerciseById(id)`: Fetch a single exercise by ID
- `createExercise(exercise)`: Create a new exercise
- `updateExercise(id, updates)`: Update an existing exercise
- `deleteExercise(id)`: Soft-delete an exercise by setting `is_active` to false

## Access Control

Row Level Security (RLS) policies are implemented to control access to the exercises table:

- All authenticated users can view active exercises
- Only admins can create, edit, or delete exercises

## Workflow

1. Users browse the exercise library, which displays all available exercises
2. Users can filter and search for specific exercises by name, category, movement pattern, or difficulty
3. Admins can add new exercises or edit/delete existing ones
4. Exercises can be referenced in workout plans and training programs