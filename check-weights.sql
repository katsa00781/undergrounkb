-- Check if we have weight data in the database
SELECT * FROM user_weights LIMIT 10;

-- Check the structure of the table
\d user_weights;

-- Count total weight records
SELECT COUNT(*) as total_weight_records FROM user_weights;
