-- First, create temporary columns with the correct type
ALTER TABLE public.events 
ADD COLUMN start_time_new time without time zone,
ADD COLUMN end_time_new time without time zone;

-- Convert existing data
UPDATE public.events 
SET start_time_new = start_time::time without time zone
WHERE start_time IS NOT NULL;

UPDATE public.events 
SET end_time_new = end_time::time without time zone
WHERE end_time IS NOT NULL;

-- Drop old columns
ALTER TABLE public.events 
DROP COLUMN start_time,
DROP COLUMN end_time;

-- Rename new columns
ALTER TABLE public.events 
RENAME COLUMN start_time_new TO start_time;

ALTER TABLE public.events 
RENAME COLUMN end_time_new TO end_time;

-- Update the date column as well
ALTER TABLE public.events 
ALTER COLUMN date TYPE date USING date::date;