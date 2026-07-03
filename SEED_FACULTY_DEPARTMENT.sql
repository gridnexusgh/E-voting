-- Quick fix: Insert missing faculties and departments to match the CSV

-- First, delete any old/incomplete data if needed
DELETE FROM departments WHERE faculty_id IN (
  SELECT id FROM faculties WHERE code IN ('FAST', 'FOE', 'FAD', 'MC', 'MEC')
);

DELETE FROM faculties WHERE code IN ('FAST', 'FOE', 'FAD', 'MC', 'MEC');

-- Insert faculties
INSERT INTO faculties (name, code, description) VALUES
  ('Faculty of Applied Science and Technology', 'FAST', 'Engineering and technology programs'),
  ('Faculty of Engineering', 'FOE', 'Mechanical, electrical, and civil engineering'),
  ('Faculty of Architecture and Design', 'FAD', 'Architecture, design, and interior design programs'),
  ('Faculty of Mechanical Engineering', 'MC', 'Mechanical engineering'),
  ('Faculty of Mechanical Engineering', 'MEC', 'Mechanical engineering')
ON CONFLICT (code) DO NOTHING;

-- Insert departments under FAST
INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Computer Science', 'CS', 'Computer Science programs' FROM faculties WHERE code = 'FAST'
ON CONFLICT (faculty_id, code) DO NOTHING;

INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Engineering', 'ENG', 'Engineering programs' FROM faculties WHERE code = 'FAST'
ON CONFLICT (faculty_id, code) DO NOTHING;

-- Insert departments under FOE
INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Biomechanical Engineering', 'BME', 'Biomechanical Engineering' FROM faculties WHERE code = 'FOE'
ON CONFLICT (faculty_id, code) DO NOTHING;

-- Insert departments under FAD
INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Fashion Studies', 'FS', 'Fashion design and studies' FROM faculties WHERE code = 'FAD'
ON CONFLICT (faculty_id, code) DO NOTHING;

INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Interior Architecture', 'IA', 'Interior design and architecture' FROM faculties WHERE code = 'FAD'
ON CONFLICT (faculty_id, code) DO NOTHING;

-- Insert departments under MC/MEC (for mechanical engineering)
INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Mechanical', 'MC', 'Mechanical engineering' FROM faculties WHERE code = 'MC'
ON CONFLICT (faculty_id, code) DO NOTHING;

INSERT INTO departments (faculty_id, name, code, description) 
SELECT id, 'Mechanical', 'MEC', 'Mechanical engineering' FROM faculties WHERE code = 'MEC'
ON CONFLICT (faculty_id, code) DO NOTHING;
