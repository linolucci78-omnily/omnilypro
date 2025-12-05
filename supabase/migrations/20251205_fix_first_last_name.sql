-- Force update first_name and last_name from name field for all customers
UPDATE public.customers
SET
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE
        WHEN POSITION(' ' IN name) > 0
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE NULL
    END
WHERE name IS NOT NULL;
