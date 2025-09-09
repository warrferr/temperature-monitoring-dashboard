/*
  # Temperature Monitoring Schema

  1. New Tables
    - `devices`
      - `id` (uuid, primary key)
      - `particle_id` (text, unique) - The Particle device ID
      - `name` (text) - Human readable name for the device
      - `is_active` (boolean, default true) - Whether the device is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `temperature_readings`
      - `id` (uuid, primary key)
      - `device_id` (uuid, foreign key to devices)
      - `particle_id` (text) - For direct reference to particle device
      - `temperature` (numeric) - Temperature reading
      - `timestamp` (timestamptz) - When the reading was taken
      - `created_at` (timestamptz) - When the record was created

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (since this is monitoring data)

  3. Sample Data
    - Insert the three Particle devices provided
*/

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  particle_id text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create temperature_readings table
CREATE TABLE IF NOT EXISTS temperature_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  particle_id text NOT NULL,
  temperature numeric NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to devices"
  ON devices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to temperature readings"
  ON temperature_readings
  FOR SELECT
  TO public
  USING (true);

-- Create policies for inserting temperature data (for webhooks)
CREATE POLICY "Allow public insert for temperature readings"
  ON temperature_readings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temperature_readings_particle_id ON temperature_readings(particle_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_timestamp ON temperature_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_device_timestamp ON temperature_readings(device_id, timestamp DESC);

-- Insert the three Particle devices
INSERT INTO devices (particle_id, name) VALUES 
  ('450033000c47363433353735', 'Temperature Sensor 1'),
  ('3c003a000247363333343435', 'Temperature Sensor 2'),
  ('3a0040000d47363330353437', 'Temperature Sensor 3')
ON CONFLICT (particle_id) DO NOTHING;

-- Create function to update device updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating device timestamp
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_updated_at();