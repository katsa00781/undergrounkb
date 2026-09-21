export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          name: string
          description: string | null
          instructions: string | null
          category: Database['public']['Enums']['exercise_category']
          movement_pattern: Database['public']['Enums']['movement_pattern']
          difficulty: number
          image_url: string | null
          video_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          is_active: boolean
          reviewed: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          instructions?: string | null
          category: Database['public']['Enums']['exercise_category']
          movement_pattern: Database['public']['Enums']['movement_pattern']
          difficulty: number
          image_url?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
          reviewed?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          instructions?: string | null
          category?: Database['public']['Enums']['exercise_category']
          movement_pattern?: Database['public']['Enums']['movement_pattern']
          difficulty?: number
          image_url?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
          reviewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_taxonomy_assignments: {
        Row: {
          exercise_id: string
          exercise_taxonomy_tag_id: string
          source: Database['public']['Enums']['exercise_taxonomy_assignment_source']
          is_primary: boolean
          created_at: string
        }
        Insert: {
          exercise_id: string
          exercise_taxonomy_tag_id: string
          source?: Database['public']['Enums']['exercise_taxonomy_assignment_source']
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          exercise_id?: string
          exercise_taxonomy_tag_id?: string
          source?: Database['public']['Enums']['exercise_taxonomy_assignment_source']
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_taxonomy_assignments_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_taxonomy_assignments_exercise_taxonomy_tag_id_fkey"
            columns: ["exercise_taxonomy_tag_id"]
            referencedRelation: "exercise_taxonomy_tags"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_taxonomy_tags: {
        Row: {
          id: string
          slug: string
          label: string
          dimension: Database['public']['Enums']['exercise_taxonomy_dimension']
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          label: string
          dimension: Database['public']['Enums']['exercise_taxonomy_dimension']
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          label?: string
          dimension?: Database['public']['Enums']['exercise_taxonomy_dimension']
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null  // Új mező - ProfileFormData.displayName
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          // Extended profile fields - ProfileFormData mezők
          height: number | null
          weight: number | null
          birthdate: string | null
          gender: string | null
          fitness_goals: string[] | null
          experience_level: string | null
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null  // Új mező
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          // Extended profile fields
          height?: number | null
          weight?: number | null
          birthdate?: string | null
          gender?: string | null
          fitness_goals?: string[] | null
          experience_level?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null  // Új mező
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          // Extended profile fields
          height?: number | null
          weight?: number | null
          birthdate?: string | null
          gender?: string | null
          fitness_goals?: string[] | null
          experience_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          title: string
          start_time: string
          end_time: string
          client_id: string | null
          trainer_id: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_time: string
          end_time: string
          client_id?: string | null
          trainer_id: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_time?: string
          end_time?: string
          client_id?: string | null
          trainer_id?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_trainer_id_fkey"
            columns: ["trainer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_programs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          generator_mode: string
          params: Json
          week_count: number
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          generator_mode: string
          params?: Json
          week_count: number
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          generator_mode?: string
          params?: Json
          week_count?: number
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_programs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      workouts: {
        Row: {
          id: string
          title: string
          date: string
          duration: number
          notes: string | null
          sections: Json
          created_at: string
          updated_at: string
          user_id: string
          program_id: string | null
          program_week: number | null
          program_day_label: string | null
          program_sequence: number | null
        }
        Insert: {
          id?: string
          title: string
          date: string
          duration: number
          notes?: string | null
          sections: Json
          created_at?: string
          updated_at?: string
          user_id: string
          program_id?: string | null
          program_week?: number | null
          program_day_label?: string | null
          program_sequence?: number | null
        }
        Update: {
          id?: string
          title?: string
          date?: string
          duration?: number
          notes?: string | null
          sections?: Json
          created_at?: string
          updated_at?: string
          user_id?: string
          program_id?: string | null
          program_week?: number | null
          program_day_label?: string | null
          program_sequence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_program_id_fkey"
            columns: ["program_id"]
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          }
        ]
      },
      fms_assessments: {
        Row: {
          id: string
          user_id: string
          date: string
          deep_squat: number
          hurdle_step: number
          inline_lunge: number
          shoulder_mobility: number
          active_straight_leg_raise: number
          trunk_stability_pushup: number
          rotary_stability: number
          hurdle_step_left: number | null
          hurdle_step_right: number | null
          inline_lunge_left: number | null
          inline_lunge_right: number | null
          shoulder_mobility_left: number | null
          shoulder_mobility_right: number | null
          active_straight_leg_raise_left: number | null
          active_straight_leg_raise_right: number | null
          rotary_stability_left: number | null
          rotary_stability_right: number | null
          sm_clearing: boolean
          tspu_clearing: boolean
          rs_clearing: boolean
          total_score: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          deep_squat: number
          hurdle_step: number
          inline_lunge: number
          shoulder_mobility: number
          active_straight_leg_raise: number
          trunk_stability_pushup: number
          rotary_stability: number
          hurdle_step_left?: number | null
          hurdle_step_right?: number | null
          inline_lunge_left?: number | null
          inline_lunge_right?: number | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          active_straight_leg_raise_left?: number | null
          active_straight_leg_raise_right?: number | null
          rotary_stability_left?: number | null
          rotary_stability_right?: number | null
          sm_clearing?: boolean
          tspu_clearing?: boolean
          rs_clearing?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          deep_squat?: number
          hurdle_step?: number
          inline_lunge?: number
          shoulder_mobility?: number
          active_straight_leg_raise?: number
          trunk_stability_pushup?: number
          rotary_stability?: number
          hurdle_step_left?: number | null
          hurdle_step_right?: number | null
          inline_lunge_left?: number | null
          inline_lunge_right?: number | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          active_straight_leg_raise_left?: number | null
          active_straight_leg_raise_right?: number | null
          rotary_stability_left?: number | null
          rotary_stability_right?: number | null
          sm_clearing?: boolean
          tspu_clearing?: boolean
          rs_clearing?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fms_assessments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      manual_guests: {
        Row: {
          id: string
          owner_user_id: string
          name: string
          linked_fms_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          name: string
          linked_fms_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          name?: string
          linked_fms_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_guests_linked_fms_user_id_fkey"
            columns: ["linked_fms_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_guests_owner_user_id_fkey"
            columns: ["owner_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      polar_connections: {
        Row: {
          user_id: string
          polar_user_id: string | null
          access_token: string
          member_id: string | null
          last_transaction_id: string | null
          connected_at: string
          last_sync_at: string | null
        }
        Insert: {
          user_id: string
          polar_user_id?: string | null
          access_token: string
          member_id?: string | null
          last_transaction_id?: string | null
          connected_at?: string
          last_sync_at?: string | null
        }
        Update: {
          user_id?: string
          polar_user_id?: string | null
          access_token?: string
          member_id?: string | null
          last_transaction_id?: string | null
          connected_at?: string
          last_sync_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polar_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          protein_meals: Json
          checklist: Json
          created_at: string
          updated_at: string
          steps: number | null
          is_rest_day: boolean
          active_energy_kcal: number | null
          sleep_score: number | null
          sleep_minutes: number | null
          sleep_in_bed_minutes: number | null
          sleep_deep_minutes: number | null
          sleep_rem_minutes: number | null
          sleep_light_minutes: number | null
          sleep_awake_minutes: number | null
          sleep_awakenings: number | null
          sleep_efficiency: number | null
          sleep_start: string | null
          sleep_end: string | null
          stress_level: number | null
          energy_level: number | null
          shift_key: string | null
          resting_heart_rate: number | null
          hrv_sdnn: number | null
          sleep_wake_stage: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          protein_meals?: Json
          checklist?: Json
          created_at?: string
          updated_at?: string
          steps?: number | null
          is_rest_day?: boolean
          active_energy_kcal?: number | null
          sleep_score?: number | null
          sleep_minutes?: number | null
          sleep_in_bed_minutes?: number | null
          sleep_deep_minutes?: number | null
          sleep_rem_minutes?: number | null
          sleep_light_minutes?: number | null
          sleep_awake_minutes?: number | null
          sleep_awakenings?: number | null
          sleep_efficiency?: number | null
          sleep_start?: string | null
          sleep_end?: string | null
          stress_level?: number | null
          energy_level?: number | null
          shift_key?: string | null
          resting_heart_rate?: number | null
          hrv_sdnn?: number | null
          sleep_wake_stage?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          protein_meals?: Json
          checklist?: Json
          created_at?: string
          updated_at?: string
          steps?: number | null
          is_rest_day?: boolean
          active_energy_kcal?: number | null
          sleep_score?: number | null
          sleep_minutes?: number | null
          sleep_in_bed_minutes?: number | null
          sleep_deep_minutes?: number | null
          sleep_rem_minutes?: number | null
          sleep_light_minutes?: number | null
          sleep_awake_minutes?: number | null
          sleep_awakenings?: number | null
          sleep_efficiency?: number | null
          sleep_start?: string | null
          sleep_end?: string | null
          stress_level?: number | null
          energy_level?: number | null
          shift_key?: string | null
          resting_heart_rate?: number | null
          hrv_sdnn?: number | null
          sleep_wake_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cardio_sessions: {
        Row: {
          id: string
          user_id: string
          polar_exercise_id: string
          source: string
          start_time: string | null
          duration_seconds: number | null
          sport: string | null
          calories: number | null
          hr_avg: number | null
          hr_max: number | null
          training_load: number | null
          hr_zones: Json | null
          raw: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          polar_exercise_id: string
          source?: string
          start_time?: string | null
          duration_seconds?: number | null
          sport?: string | null
          calories?: number | null
          hr_avg?: number | null
          hr_max?: number | null
          training_load?: number | null
          hr_zones?: Json | null
          raw?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          polar_exercise_id?: string
          source?: string
          start_time?: string | null
          duration_seconds?: number | null
          sport?: string | null
          calories?: number | null
          hr_avg?: number | null
          hr_max?: number | null
          training_load?: number | null
          hr_zones?: Json | null
          raw?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_weights: {
        Row: {
          id: string
          user_id: string
          weight: number
          created_at: string
          date: string | null
          notes: string | null
          bodyfat: number | null
          muscle: number | null
          bmi: number | null
          deep_sleep: number | null
          rest_rating: number | null
        }
        Insert: {
          id?: string
          user_id: string
          weight: number
          created_at?: string
          date?: string | null
          notes?: string | null
          bodyfat?: number | null
          muscle?: number | null
          bmi?: number | null
          deep_sleep?: number | null
          rest_rating?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number
          created_at?: string
          date?: string | null
          notes?: string | null
          bodyfat?: number | null
          muscle?: number | null
          bmi?: number | null
          deep_sleep?: number | null
          rest_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_weights_user_id"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Kalória-kalkulátor / étel-napló – ugyanaz a séma, amit a mobil app
      // (Underground KB Mobile) használ, közös Supabase projekt. Ne hozz létre
      // ehhez új migrációt: a táblák és az RLS policy-k már élnek.
      foods: {
        Row: {
          id: string
          source: string
          barcode: string | null
          name: string
          brand: string | null
          kcal_100: number
          protein_100: number
          carbs_100: number
          fat_100: number
          fiber_100: number | null
          sugar_100: number | null
          salt_100: number | null
          serving_g: number | null
          serving_label: string | null
          image_url: string | null
          verified: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source?: string
          barcode?: string | null
          name: string
          brand?: string | null
          kcal_100: number
          protein_100?: number
          carbs_100?: number
          fat_100?: number
          fiber_100?: number | null
          sugar_100?: number | null
          salt_100?: number | null
          serving_g?: number | null
          serving_label?: string | null
          image_url?: string | null
          verified?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          barcode?: string | null
          name?: string
          brand?: string | null
          kcal_100?: number
          protein_100?: number
          carbs_100?: number
          fat_100?: number
          fiber_100?: number | null
          sugar_100?: number | null
          salt_100?: number | null
          serving_g?: number | null
          serving_label?: string | null
          image_url?: string | null
          verified?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      food_log_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_index: number
          food_id: string | null
          recipe_id: string | null
          name: string
          grams: number
          servings: number | null
          kcal: number
          protein: number
          carbs: number
          fat: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          meal_index?: number
          food_id?: string | null
          recipe_id?: string | null
          name: string
          grams: number
          servings?: number | null
          kcal?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          meal_index?: number
          food_id?: string | null
          recipe_id?: string | null
          name?: string
          grams?: number
          servings?: number | null
          kcal?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_log_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_entries_food_id_fkey"
            columns: ["food_id"]
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          kind: string
          name: string
          servings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind?: string
          name: string
          servings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          name?: string
          servings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_items: {
        Row: {
          id: string
          recipe_id: string
          position: number
          food_id: string | null
          name: string
          grams: number
          kcal: number
          protein: number
          carbs: number
          fat: number
        }
        Insert: {
          id?: string
          recipe_id: string
          position?: number
          food_id?: string | null
          name: string
          grams: number
          kcal?: number
          protein?: number
          carbs?: number
          fat?: number
        }
        Update: {
          id?: string
          recipe_id?: string
          position?: number
          food_id?: string | null
          name?: string
          grams?: number
          kcal?: number
          protein?: number
          carbs?: number
          fat?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_food_id_fkey"
            columns: ["food_id"]
            referencedRelation: "foods"
            referencedColumns: ["id"]
          }
        ]
      }
      lifestyle_settings: {
        Row: {
          id: string
          user_id: string
          shift_anchor_date: string | null
          shift_order: Json
          eating_window_start: string
          eating_window_end: string
          protein_goal_min: number
          protein_goal_max: number
          custom_schedules: Json
          eating_windows: Json
          step_goal: number
          self_check_reminder_enabled: boolean
          self_check_reminder_time: string
          kcal_goal: number | null
          carbs_goal_g: number | null
          fat_goal_g: number | null
          activity_factor: number
          goal_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shift_anchor_date?: string | null
          shift_order?: Json
          eating_window_start?: string
          eating_window_end?: string
          protein_goal_min?: number
          protein_goal_max?: number
          custom_schedules?: Json
          eating_windows?: Json
          step_goal?: number
          self_check_reminder_enabled?: boolean
          self_check_reminder_time?: string
          kcal_goal?: number | null
          carbs_goal_g?: number | null
          fat_goal_g?: number | null
          activity_factor?: number
          goal_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shift_anchor_date?: string | null
          shift_order?: Json
          eating_window_start?: string
          eating_window_end?: string
          protein_goal_min?: number
          protein_goal_max?: number
          custom_schedules?: Json
          eating_windows?: Json
          step_goal?: number
          self_check_reminder_enabled?: boolean
          self_check_reminder_time?: string
          kcal_goal?: number | null
          carbs_goal_g?: number | null
          fat_goal_g?: number | null
          activity_factor?: number
          goal_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifestyle_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_polar_status: {
        Args: Record<string, never>
        Returns: {
          connected: boolean
          connected_at: string | null
          last_sync_at: string | null
        }[]
      }
    }
    Enums: {
      exercise_category: 'strength_training' | 'cardio' | 'kettlebell' | 'mobility_flexibility' | 'hiit' | 'recovery' | 'fms' | 'smr'
      exercise_taxonomy_assignment_source: 'derived' | 'manual'
      exercise_taxonomy_dimension: 'category' | 'equipment' | 'pattern_family' | 'laterality' | 'exact_pattern'
      movement_pattern: 'gait_stability' | 'gait_crawling' | 'hip_dominant_bilateral' | 'hip_dominant_unilateral' | 'knee_dominant_bilateral' | 'knee_dominant_unilateral' | 'horizontal_push_bilateral' | 'horizontal_push_unilateral' | 'horizontal_pull_bilateral' | 'horizontal_pull_unilateral' | 'vertical_push_bilateral' | 'vertical_push_unilateral' | 'vertical_pull_bilateral' | 'stability_anti_extension' | 'stability_anti_rotation' | 'stability_anti_flexion' | 'core_other' | 'local_exercises' | 'upper_body_mobility' | 'aslr_correction_first' | 'aslr_correction_second' | 'sm_correction_first' | 'sm_correction_second' | 'stability_correction' | 'mobilization'
    }
  }
}
