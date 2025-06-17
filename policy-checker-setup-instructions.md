# Security Status Checker Setup Instructions

The admin dashboard's Security Status section requires certain database functions to check RLS policies. Follow these instructions to set up the necessary components.

## 1. Create the Required SQL Functions

You need to execute the SQL code from `check-write-access-rpc.sql` in your Supabase database. This creates a function that helps check write access permissions without making permanent changes to your data.

### Option A: Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `check-write-access-rpc.sql`
5. Click "Run" to execute the query

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db run --file=check-write-access-rpc.sql
```

## 2. Create the get_policies Function

Additionally, you need a function to get the RLS policies for a table. Here's the SQL to create it:

```sql
CREATE OR REPLACE FUNCTION get_policies(table_name text)
RETURNS TABLE (
  name text,
  operation text,
  command text,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.policyname AS name,
    CASE
      WHEN p.cmd = 'r' THEN 'SELECT'
      WHEN p.cmd = 'a' THEN 'INSERT'
      WHEN p.cmd = 'w' THEN 'UPDATE'
      WHEN p.cmd = 'd' THEN 'DELETE'
      ELSE p.cmd::text
    END AS operation,
    pg_get_expr(p.qual, p.tableoid) AS command,
    p.roles
  FROM
    pg_policy p
    JOIN pg_class c ON p.tableid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE
    n.nspname = 'public' AND
    c.relname = table_name;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_policies(text) TO anon;
```

Execute this SQL using either method described above.

## 3. Testing the Solution

1. After applying these functions, reload the admin dashboard
2. Check the browser console for any error messages
3. Verify that the Security Status section now displays policy information instead of errors

## 4. Fallback Mechanism

The dashboard now includes a fallback mechanism if the RPC calls fail. This will:

1. Test read access to the tables directly
2. Test write access using the new `check_write_access` function
3. Display inferred policy information based on these tests

This ensures the Security Status section provides meaningful information even if the primary method fails.