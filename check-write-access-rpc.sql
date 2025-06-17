-- Function to check write access to a table without making permanent changes
CREATE OR REPLACE FUNCTION check_write_access(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result boolean;
BEGIN
  -- Start transaction that we will roll back
  BEGIN
    -- For groups table
    IF table_name = 'groups' THEN
      -- Attempt to insert a test record
      INSERT INTO groups (name, description, created_at, test_record)
      VALUES ('__TEST_RECORD__', 'This is a test record that will be rolled back', NOW(), true)
      RETURNING true INTO result;
      
    -- For events table
    ELSIF table_name = 'events' THEN
      -- Attempt to insert a test record
      INSERT INTO events (title, description, date, group_id, created_at, test_record)
      VALUES (
        '__TEST_RECORD__', 
        'This is a test record that will be rolled back', 
        NOW(),
        (SELECT id FROM groups LIMIT 1),
        NOW(),
        true
      )
      RETURNING true INTO result;
      
    ELSE
      RAISE EXCEPTION 'Unknown table: %', table_name;
    END IF;
    
    -- Always roll back the transaction
    RAISE EXCEPTION 'ROLLBACK_TRANSACTION' USING ERRCODE = '40000';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Check if this is our expected rollback
      IF SQLERRM = 'ROLLBACK_TRANSACTION' THEN
        -- This means the insert succeeded but we rolled back
        result := true;
      ELSE
        -- This means the insert failed due to permissions or other errors
        result := false;
      END IF;
  END;
  
  RETURN result;
END;
$$;

-- Modify schema if needed to add test_record column
DO $$
BEGIN
  -- Add test_record column to groups if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'groups' AND column_name = 'test_record'
  ) THEN
    ALTER TABLE groups ADD COLUMN test_record boolean DEFAULT false;
  END IF;
  
  -- Add test_record column to events if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'test_record'
  ) THEN
    ALTER TABLE events ADD COLUMN test_record boolean DEFAULT false;
  END IF;
END
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION check_write_access(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_write_access(text) TO anon;