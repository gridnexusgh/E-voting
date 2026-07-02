-- Seed faculties that match the CSV import
INSERT INTO faculties (name, code, description) VALUES
  ('Faculty of Applied Science and Technology', 'FAST', 'Engineering and technology programs'),
  ('Faculty of Engineering', 'FOE', 'Mechanical, electrical, and civil engineering'),
  ('Faculty of Architecture and Design', 'FAD', 'Architecture, design, and interior design programs')
ON CONFLICT (code) DO NOTHING;

-- Get faculty IDs for reference
WITH fast_id AS (
  SELECT id FROM faculties WHERE code = 'FAST'
),
foe_id AS (
  SELECT id FROM faculties WHERE code = 'FOE'
),
fad_id AS (
  SELECT id FROM faculties WHERE code = 'FAD'
)
-- Seed departments
INSERT INTO departments (faculty_id, name, code, description) VALUES
  ((SELECT id FROM fast_id), 'Computer Science', 'CS', 'CS programs'),
  ((SELECT id FROM fast_id), 'Engineering', 'ENG', 'Engineering programs'),
  ((SELECT id FROM foe_id), 'Biomechanical Engineering', 'BME', 'BME programs'),
  ((SELECT id FROM fad_id), 'Fashion Studies', 'FS', 'Fashion design and studies'),
  ((SELECT id FROM fad_id), 'Interior Architecture', 'IA', 'Interior design and architecture')
ON CONFLICT (faculty_id, code) DO NOTHING;
