
CREATE OR REPLACE FUNCTION public.get_schema_sql()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result text := '';
  tbl record;
  col record;
  con record;
  first_col boolean;
BEGIN
  -- Enum types
  FOR tbl IN 
    SELECT t.typname, string_agg(e.enumlabel, ''', ''' ORDER BY e.enumsortorder) as vals
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  LOOP
    result := result || 'CREATE TYPE public.' || quote_ident(tbl.typname) || ' AS ENUM (''' || tbl.vals || ''');' || E'\n\n';
  END LOOP;

  -- Tables
  FOR tbl IN
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    result := result || 'CREATE TABLE public.' || quote_ident(tbl.table_name) || ' (' || E'\n';
    first_col := true;
    
    FOR col IN
      SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl.table_name
      ORDER BY ordinal_position
    LOOP
      IF NOT first_col THEN
        result := result || ',' || E'\n';
      END IF;
      first_col := false;
      
      result := result || '  ' || quote_ident(col.column_name) || ' ';
      
      IF col.data_type = 'USER-DEFINED' THEN
        result := result || col.udt_name;
      ELSIF col.data_type = 'ARRAY' THEN
        result := result || col.udt_name || '[]';
      ELSIF col.character_maximum_length IS NOT NULL THEN
        result := result || col.data_type || '(' || col.character_maximum_length || ')';
      ELSE
        result := result || col.data_type;
      END IF;
      
      IF col.is_nullable = 'NO' THEN
        result := result || ' NOT NULL';
      END IF;
      
      IF col.column_default IS NOT NULL THEN
        result := result || ' DEFAULT ' || col.column_default;
      END IF;
    END LOOP;
    
    -- Primary keys
    FOR con IN
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' AND tc.table_name = tbl.table_name AND tc.constraint_type = 'PRIMARY KEY'
    LOOP
      result := result || ',' || E'\n' || '  PRIMARY KEY (' || quote_ident(con.column_name) || ')';
    END LOOP;
    
    result := result || E'\n);\n\n';
    
    -- RLS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl.table_name AND rowsecurity = true) THEN
      result := result || 'ALTER TABLE public.' || quote_ident(tbl.table_name) || ' ENABLE ROW LEVEL SECURITY;' || E'\n\n';
    END IF;
  END LOOP;

  -- RLS Policies
  FOR tbl IN
    SELECT polname, relname, 
      CASE polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END as cmd,
      pg_get_expr(polqual, polrelid) as using_expr,
      pg_get_expr(polwithcheck, polrelid) as check_expr
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY c.relname, p.polname
  LOOP
    result := result || 'CREATE POLICY ' || quote_literal(tbl.polname) || ' ON public.' || quote_ident(tbl.relname) || ' FOR ' || tbl.cmd;
    IF tbl.using_expr IS NOT NULL THEN
      result := result || ' USING (' || tbl.using_expr || ')';
    END IF;
    IF tbl.check_expr IS NOT NULL THEN
      result := result || ' WITH CHECK (' || tbl.check_expr || ')';
    END IF;
    result := result || ';' || E'\n';
  END LOOP;

  RETURN result;
END;
$$;
