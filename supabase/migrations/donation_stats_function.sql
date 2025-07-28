-- Create a database function to calculate donation stats efficiently
CREATE OR REPLACE FUNCTION get_donation_stats(widget_id uuid)
RETURNS TABLE (
  total_raised bigint,
  total_donations bigint,
  average_donation numeric,
  unique_donors bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_raised,
    COUNT(*)::bigint as total_donations,
    COALESCE(AVG(amount), 0) as average_donation,
    COUNT(DISTINCT donor_email)::bigint as unique_donors
  FROM donations 
  WHERE donations.widget_id = get_donation_stats.widget_id
    AND status = 'succeeded';
END;
$$;