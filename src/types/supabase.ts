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
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null  // Új mező - ProfileFormData.displayName
          display_name: string | null  // Új mező - ProfileFormData.displayName
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
          display_name?: string | null  // Új mező
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
          display_name?: string | null  // Új mező
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
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exercise_category: 'strength_training' | 'cardio' | 'kettlebell' | 'mobility_flexibility' | 'hiit' | 'recovery'
      movement_pattern: 'gait_stability' | 'gait_crawling' | 'hip_dominant_bilateral' | 'hip_dominant_unilateral' | 'knee_dominant_bilateral' | 'knee_dominant_unilateral' | 'horizontal_push_bilateral' | 'horizontal_push_unilateral' | 'horizontal_pull_bilateral' | 'horizontal_pull_unilateral' | 'vertical_push_bilateral' | 'vertical_push_unilateral' | 'vertical_pull_bilateral' | 'stability_anti_extension' | 'stability_anti_rotation' | 'stability_anti_flexion' | 'core_other' | 'local_exercises' | 'upper_body_mobility' | 'aslr_correction_first' | 'aslr_correction_second' | 'sm_correction_first' | 'sm_correction_second' | 'stability_correction' | 'mobilization'
    }
  }
}
