import { supabase } from '../src/config/supabase';

async function setupFMSTable() {
  try {
    console.log('Setting up FMS assessments table...');

    // First check if the table already exists
    const { error: checkError } = await supabase
      .from('fms_assessments')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('does not exist')) {
        console.log('FMS assessments table does not exist. Creating it...');
        
        // Create the table
        const createTableSQL = `
          CREATE TABLE public.fms_assessments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            deep_squat SMALLINT NOT NULL CHECK (deep_squat BETWEEN 0 AND 3),
            hurdle_step SMALLINT NOT NULL CHECK (hurdle_step BETWEEN 0 AND 3),
            inline_lunge SMALLINT NOT NULL CHECK (inline_lunge BETWEEN 0 AND 3),
            shoulder_mobility SMALLINT NOT NULL CHECK (shoulder_mobility BETWEEN 0 AND 3),
            active_straight_leg_raise SMALLINT NOT NULL CHECK (active_straight_leg_raise BETWEEN 0 AND 3),
            trunk_stability_pushup SMALLINT NOT NULL CHECK (trunk_stability_pushup BETWEEN 0 AND 3),
            rotary_stability SMALLINT NOT NULL CHECK (rotary_stability BETWEEN 0 AND 3),
            total_score SMALLINT GENERATED ALWAYS AS (
              deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
              active_straight_leg_raise + trunk_stability_pushup + rotary_stability
            ) STORED,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS fms_assessments_user_id_idx ON public.fms_assessments (user_id);
          CREATE INDEX IF NOT EXISTS fms_assessments_date_idx ON public.fms_assessments (date);

          -- Set up RLS
          ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

          -- Create policies
          CREATE POLICY "Users can view their own assessments" 
            ON public.fms_assessments FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own assessments" 
            ON public.fms_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own assessments" 
            ON public.fms_assessments FOR UPDATE USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own assessments" 
            ON public.fms_assessments FOR DELETE USING (auth.uid() = user_id);
        `;
        
        // Execute the SQL as a superuser
        const { error: createError } = await supabase.rpc('execute_sql', {
          query: createTableSQL
        });
        
        if (createError) {
          console.error('Error creating FMS table:', createError.message);
          
          if (createError.message.includes('function "execute_sql" does not exist')) {
            console.log('The execute_sql function does not exist. Creating it first...');
            
            // Create the execute_sql function
            const createFunctionSQL = `
              CREATE OR REPLACE FUNCTION public.execute_sql(query text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE query;
              END;
              $$;
              
              -- Grant access to authenticated users
              GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
            `;
            
            const { error: functionError } = await supabase.rpc('create_execute_sql_function');
            
            if (functionError) {
              console.error('Could not create execute_sql function:', functionError.message);
              return false;
            }
            
            // Try creating the table again
            const { error: retryError } = await supabase.rpc('execute_sql', {
              query: createTableSQL
            });
            
            if (retryError) {
              console.error('Error creating FMS table (second attempt):', retryError.message);
              return false;
            }
          } else {
            return false;
          }
        }
        
        console.log('✅ FMS assessments table created successfully!');
      } else {
        console.error('Error checking FMS table:', checkError.message);
        return false;
      }
    } else {
      console.log('✅ FMS assessments table already exists.');
      
      // Check if all required columns exist
      console.log('Checking table structure...');
      
      // Try inserting a sample record to verify the structure
      const testRecord = {
        user_id: '00000000-0000-0000-0000-000000000000', // This will be rejected by RLS but will validate structure
        date: new Date().toISOString().split('T')[0],
        deep_squat: 2,
        hurdle_step: 2,
        inline_lunge: 2,
        shoulder_mobility: 2,
        active_straight_leg_raise: 2,
        trunk_stability_pushup: 2,
        rotary_stability: 2,
        notes: 'Test record for structure validation'
      };
      
      const { error: insertError } = await supabase
        .from('fms_assessments')
        .insert(testRecord)
        .select();
      
      if (insertError) {
        // If the error is about permissions, that's fine, it means the table structure is correct
        // but RLS is preventing the insert (which is expected)
        if (insertError.message.includes('permission denied')) {
          console.log('✅ Table structure validation passed (insert blocked by RLS as expected)');
          return true;
        }
        
        // If there's a column type mismatch or missing column
        if (insertError.message.includes('column') && (
            insertError.message.includes('does not exist') || 
            insertError.message.includes('cannot be cast')
          )) {
          console.error('❌ Table structure issue detected:', insertError.message);
          
          // Try to fix the table structure
          console.log('Attempting to fix table structure...');
          // This would need more sophisticated logic based on the specific error
          // For now, we'll just inform the user
          console.log('Please run a migration to fix the table structure manually.');
          return false;
        }
        
        console.error('❌ Unexpected error during validation:', insertError.message);
        return false;
      }
      
      console.log('✅ Table validation passed and test record inserted.');
      
      // Try to clean up the test record
      const { error: cleanupError } = await supabase
        .from('fms_assessments')
        .delete()
        .eq('notes', 'Test record for structure validation');
      
      if (cleanupError && !cleanupError.message.includes('permission denied')) {
        console.warn('⚠️ Could not clean up test record:', cleanupError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error setting up FMS table:', error);
    return false;
  }
}

// Run the setup process
setupFMSTable()
  .then((success) => {
    if (success) {
      console.log('✅ FMS table setup completed successfully');
      process.exit(0);
    } else {
      console.error('❌ FMS table setup failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error during FMS table setup:', error);
    process.exit(1);
  });
