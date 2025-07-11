/*
  # แก้ไขปัญหา Database และ Schema Updates
  
  1. เพิ่ม license_types table สำหรับ Driver License
  2. แก้ไข vehicle_types.capacity เป็น max_weight_tons
  3. ลบ fields brand, model, year จาก vehicles table
  4. เพิ่ม coordinates fields ใน routes table
  5. เพิ่ม indexes และ constraints สำหรับ performance
*/

-- 1. สร้างตาราง license_types สำหรับประเภทใบขับขี่
CREATE TABLE IF NOT EXISTS license_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  vehicle_type_ids UUID[] DEFAULT '{}', -- Array ของ vehicle types ที่ขับได้
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. แก้ไข vehicle_types table - เปลี่ยน capacity เป็น max_weight_tons
DO $$
BEGIN
  -- ตรวจสอบว่า column capacity มีอยู่หรือไม่
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_types' AND column_name = 'capacity'
  ) THEN
    -- เปลี่ยนชื่อ column capacity เป็น max_weight_tons
    ALTER TABLE vehicle_types RENAME COLUMN capacity TO max_weight_tons;
    
    -- เปลี่ยน data type เป็น DECIMAL สำหรับน้ำหนัก
    ALTER TABLE vehicle_types ALTER COLUMN max_weight_tons TYPE DECIMAL(5,2);
    
    -- เพิ่ม comment
    COMMENT ON COLUMN vehicle_types.max_weight_tons IS 'Maximum weight capacity in tons';
  END IF;
END $$;

-- 3. ลบ fields brand, model, year จาก vehicles table
DO $$
BEGIN
  -- ลบ column brand ถ้ามี
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'brand'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN brand;
  END IF;
  
  -- ลบ column model ถ้ามี
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'model'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN model;
  END IF;
  
  -- ลบ column year ถ้ามี
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'year'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN year;
  END IF;
END $$;

-- 4. แก้ไข drivers table - เปลี่ยน license_number เป็น license_type_id
DO $$
BEGIN
  -- เพิ่ม column license_type_id ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'license_type_id'
  ) THEN
    ALTER TABLE drivers ADD COLUMN license_type_id UUID REFERENCES license_types(id);
  END IF;
  
  -- ลบ column license_number เก่า
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE drivers DROP COLUMN license_number;
  END IF;
  
  -- เพิ่ม license_number ใหม่เป็น TEXT
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE drivers ADD COLUMN license_number TEXT;
  END IF;
END $$;

-- 5. เพิ่ม coordinates fields ใน routes table (ถ้ายังไม่มี)
DO $$
BEGIN
  -- เพิ่ม origin_latitude ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routes' AND column_name = 'origin_latitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN origin_latitude DECIMAL(10,8);
  END IF;
  
  -- เพิ่ม origin_longitude ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routes' AND column_name = 'origin_longitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN origin_longitude DECIMAL(11,8);
  END IF;
  
  -- เพิ่ม destination_latitude ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routes' AND column_name = 'destination_latitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN destination_latitude DECIMAL(10,8);
  END IF;
  
  -- เพิ่ม destination_longitude ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routes' AND column_name = 'destination_longitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN destination_longitude DECIMAL(11,8);
  END IF;
END $$;

-- เพิ่ม constraint สำหรับ coordinates validation
ALTER TABLE routes ADD CONSTRAINT check_origin_latitude 
  CHECK (origin_latitude IS NULL OR (origin_latitude >= -90 AND origin_latitude <= 90));

ALTER TABLE routes ADD CONSTRAINT check_origin_longitude 
  CHECK (origin_longitude IS NULL OR (origin_longitude >= -180 AND origin_longitude <= 180));

ALTER TABLE routes ADD CONSTRAINT check_destination_latitude 
  CHECK (destination_latitude IS NULL OR (destination_latitude >= -90 AND destination_latitude <= 90));

ALTER TABLE routes ADD CONSTRAINT check_destination_longitude 
  CHECK (destination_longitude IS NULL OR (destination_longitude >= -180 AND destination_longitude <= 180));

-- เพิ่ม unique constraint สำหรับ driver name + license_number
ALTER TABLE drivers ADD CONSTRAINT unique_driver_name_license 
  UNIQUE (name, license_number);

-- เพิ่ม unique constraint สำหรับ vehicle plate_number (ถ้ายังไม่มี)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'vehicles' AND constraint_name = 'vehicles_plate_number_key'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_plate_number_unique UNIQUE (plate_number);
  END IF;
END $$;

-- Insert ข้อมูล license_types ตัวอย่าง
INSERT INTO license_types (license_code, name, description, vehicle_type_ids) VALUES
('LIC001', 'ใบขับขี่รถยนต์ส่วนบุคคล', 'ใบขับขี่สำหรับรถยนต์ส่วนบุคคล', '{}'),
('LIC002', 'ใบขับขี่รถบรรทุก', 'ใบขับขี่สำหรับรถบรรทุกขนาดเล็ก', '{}'),
('LIC003', 'ใบขับขี่รถบรรทุกใหญ่', 'ใบขับขี่สำหรับรถบรรทุกขนาดใหญ่', '{}'),
('LIC004', 'ใบขับขี่รถโดยสาร', 'ใบขับขี่สำหรับรถโดยสารประจำทาง', '{}'),
('LIC005', 'ใบขับขี่รถตู้', 'ใบขับขี่สำหรับรถตู้โดยสาร', '{}')
ON CONFLICT (license_code) DO NOTHING;

-- Update vehicle_types ตัวอย่างข้อมูลใหม่
UPDATE vehicle_types SET max_weight_tons = 1.5 WHERE name = 'Van';
UPDATE vehicle_types SET max_weight_tons = 10.0 WHERE name = 'Truck';
UPDATE vehicle_types SET max_weight_tons = 15.0 WHERE name = 'Bus';
UPDATE vehicle_types SET max_weight_tons = 3.0 WHERE name = 'Pickup';
UPDATE vehicle_types SET max_weight_tons = 2.5 WHERE name = 'SUV';

-- เพิ่ม indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_license_types_active ON license_types(is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_license_type ON drivers(license_type_id);
CREATE INDEX IF NOT EXISTS idx_drivers_name_license ON drivers(name, license_number);
CREATE INDEX IF NOT EXISTS idx_routes_coordinates ON routes(origin_latitude, origin_longitude, destination_latitude, destination_longitude);

-- Enable RLS สำหรับ license_types
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS policy สำหรับ license_types
CREATE POLICY "Enable all for authenticated users" ON license_types FOR ALL TO authenticated USING (true);

-- เพิ่ม audit trigger สำหรับ license_types
CREATE TRIGGER audit_license_types AFTER INSERT OR UPDATE OR DELETE ON license_types
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Grant permissions
GRANT SELECT ON TABLE license_types TO anon;

-- เพิ่ม function สำหรับตรวจสอบ driver สามารถขับรถประเภทไหนได้บ้าง
CREATE OR REPLACE FUNCTION get_driver_allowed_vehicle_types(p_driver_id UUID)
RETURNS TABLE(vehicle_type_id UUID, vehicle_type_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT vt.id, vt.name
  FROM drivers d
  JOIN license_types lt ON d.license_type_id = lt.id
  JOIN vehicle_types vt ON vt.id = ANY(lt.vehicle_type_ids)
  WHERE d.id = p_driver_id AND lt.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_driver_allowed_vehicle_types(UUID) TO authenticated, anon;

-- เพิ่ม function สำหรับตรวจสอบ duplicate driver
CREATE OR REPLACE FUNCTION check_duplicate_driver(
  p_name TEXT,
  p_license_number TEXT,
  p_driver_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM drivers
  WHERE name = p_name 
    AND license_number = p_license_number
    AND (p_driver_id IS NULL OR id != p_driver_id);
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_duplicate_driver(TEXT, TEXT, UUID) TO authenticated, anon;

-- เพิ่ม function สำหรับตรวจสอบ duplicate vehicle
CREATE OR REPLACE FUNCTION check_duplicate_vehicle(
  p_plate_number TEXT,
  p_vehicle_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM vehicles
  WHERE plate_number = p_plate_number
    AND (p_vehicle_id IS NULL OR id != p_vehicle_id);
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_duplicate_vehicle(TEXT, UUID) TO authenticated, anon;

-- เพิ่ม comments สำหรับ documentation
COMMENT ON TABLE license_types IS 'ประเภทใบขับขี่และรถที่สามารถขับได้';
COMMENT ON COLUMN license_types.vehicle_type_ids IS 'Array ของ vehicle type IDs ที่ใบขับขี่นี้สามารถขับได้';
COMMENT ON COLUMN vehicle_types.max_weight_tons IS 'น้ำหนักบรรทุกสูงสุด (ตัน)';
COMMENT ON COLUMN routes.origin_latitude IS 'ละติจูดจุดเริ่มต้น';
COMMENT ON COLUMN routes.origin_longitude IS 'ลองจิจูดจุดเริ่มต้น';
COMMENT ON COLUMN routes.destination_latitude IS 'ละติจูดจุดหมาย';
COMMENT ON COLUMN routes.destination_longitude IS 'ลองจิจูดจุดหมาย';

-- สร้าง view สำหรับ driver license information
CREATE OR REPLACE VIEW driver_license_info AS
SELECT 
  d.id,
  d.driver_code,
  d.name,
  d.phone,
  d.email,
  d.license_number,
  d.status,
  lt.license_code,
  lt.name AS license_type_name,
  lt.description AS license_description,
  d.created_at,
  d.updated_at
FROM drivers d
LEFT JOIN license_types lt ON d.license_type_id = lt.id;

-- Grant permissions สำหรับ view
GRANT SELECT ON driver_license_info TO authenticated, anon;

RAISE NOTICE 'Database schema updates completed successfully!';