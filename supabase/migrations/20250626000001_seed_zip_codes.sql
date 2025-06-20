-- Insert sample ZIP codes for major US cities to enable location search
-- This is a minimal set to get started - in production you'd load a full ZIP database

INSERT INTO zip_codes (zip_code, city, state, latitude, longitude, timezone) VALUES
-- New York
('10001', 'New York', 'NY', 40.7506, -73.9972, 'America/New_York'),
('10019', 'New York', 'NY', 40.7640, -73.9790, 'America/New_York'),
('10036', 'New York', 'NY', 40.7589, -73.9851, 'America/New_York'),

-- Los Angeles
('90210', 'Beverly Hills', 'CA', 34.0901, -118.4065, 'America/Los_Angeles'),
('90028', 'Hollywood', 'CA', 34.1016, -118.3267, 'America/Los_Angeles'),
('90015', 'Los Angeles', 'CA', 34.0405, -118.2669, 'America/Los_Angeles'),

-- Chicago
('60601', 'Chicago', 'IL', 41.8825, -87.6293, 'America/Chicago'),
('60611', 'Chicago', 'IL', 41.8955, -87.6295, 'America/Chicago'),
('60614', 'Chicago', 'IL', 41.9289, -87.6438, 'America/Chicago'),

-- Nashville
('37201', 'Nashville', 'TN', 36.1670, -86.7823, 'America/Chicago'),
('37203', 'Nashville', 'TN', 36.1507, -86.8025, 'America/Chicago'),

-- Austin
('78701', 'Austin', 'TX', 30.2695, -97.7444, 'America/Chicago'),
('78704', 'Austin', 'TX', 30.2415, -97.7594, 'America/Chicago'),

-- Boston
('02101', 'Boston', 'MA', 42.3584, -71.0598, 'America/New_York'),
('02215', 'Boston', 'MA', 42.3467, -71.0972, 'America/New_York'),

-- Miami
('33101', 'Miami', 'FL', 25.7743, -80.1937, 'America/New_York'),
('33139', 'Miami Beach', 'FL', 25.7907, -80.1300, 'America/New_York'),

-- Las Vegas
('89101', 'Las Vegas', 'NV', 36.1716, -115.1391, 'America/Los_Angeles'),
('89109', 'Las Vegas', 'NV', 36.1146, -115.1728, 'America/Los_Angeles'),

-- Seattle
('98101', 'Seattle', 'WA', 47.6062, -122.3321, 'America/Los_Angeles'),
('98109', 'Seattle', 'WA', 47.6205, -122.3493, 'America/Los_Angeles'),

-- Denver
('80202', 'Denver', 'CO', 39.7516, -104.9876, 'America/Denver'),
('80203', 'Denver', 'CO', 39.7364, -104.9738, 'America/Denver'),

-- Atlanta
('30309', 'Atlanta', 'GA', 33.7838, -84.3946, 'America/New_York'),
('30313', 'Atlanta', 'GA', 33.7490, -84.3880, 'America/New_York'),

-- San Francisco
('94102', 'San Francisco', 'CA', 37.7749, -122.4194, 'America/Los_Angeles'),
('94103', 'San Francisco', 'CA', 37.7716, -122.4135, 'America/Los_Angeles'),

-- Philadelphia
('19102', 'Philadelphia', 'PA', 39.9526, -75.1652, 'America/New_York'),
('19107', 'Philadelphia', 'PA', 39.9496, -75.1503, 'America/New_York'),

-- Washington DC
('20001', 'Washington', 'DC', 38.9072, -77.0369, 'America/New_York'),
('20004', 'Washington', 'DC', 38.8941, -77.0278, 'America/New_York')

ON CONFLICT (zip_code) DO NOTHING;

-- Create function to get city/state from ZIP
CREATE OR REPLACE FUNCTION get_location_from_zip(p_zip_code TEXT)
RETURNS TABLE (
  city TEXT,
  state TEXT,
  latitude DECIMAL,
  longitude DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT z.city, z.state, z.latitude, z.longitude
  FROM zip_codes z
  WHERE z.zip_code = p_zip_code;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_location_from_zip(TEXT) TO anon, authenticated;