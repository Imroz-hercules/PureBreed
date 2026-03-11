-- Create PostgreSQL table for PLC Live Data
-- This table stores real-time PLC data from DB4 (Pellet Production Data)

CREATE TABLE IF NOT EXISTS public.plc_live_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- DB4 - Pellet Production Data (matching the image structure)
    pellet1_ton_hr FLOAT,
    pellet2_ton_hr FLOAT,
    pellet3_ton_hr FLOAT,
    pellet1_kw_ton FLOAT,
    pellet2_kw_ton FLOAT,
    pellet3_kw_ton FLOAT,
    pellet1_temp FLOAT,
    pellet2_temp FLOAT,
    pellet3_temp FLOAT
);

-- Create index on timestamp for better query performance
CREATE INDEX IF NOT EXISTS idx_plc_live_data_timestamp ON public.plc_live_data(timestamp DESC);

-- Create index on id for better performance
CREATE INDEX IF NOT EXISTS idx_plc_live_data_id ON public.plc_live_data(id DESC);

-- Add comments to table and columns
COMMENT ON TABLE public.plc_live_data IS 'Real-time PLC data from DB4 (Pellet Production Data)';
COMMENT ON COLUMN public.plc_live_data.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN public.plc_live_data.timestamp IS 'Timestamp when data was recorded';
COMMENT ON COLUMN public.plc_live_data.pellet1_ton_hr IS 'Pellet 1 production rate (tons per hour)';
COMMENT ON COLUMN public.plc_live_data.pellet2_ton_hr IS 'Pellet 2 production rate (tons per hour)';
COMMENT ON COLUMN public.plc_live_data.pellet3_ton_hr IS 'Pellet 3 production rate (tons per hour)';
COMMENT ON COLUMN public.plc_live_data.pellet1_kw_ton IS 'Pellet 1 power consumption (kW per ton)';
COMMENT ON COLUMN public.plc_live_data.pellet2_kw_ton IS 'Pellet 2 power consumption (kW per ton)';
COMMENT ON COLUMN public.plc_live_data.pellet3_kw_ton IS 'Pellet 3 power consumption (kW per ton)';
COMMENT ON COLUMN public.plc_live_data.pellet1_temp IS 'Pellet 1 temperature (°C)';
COMMENT ON COLUMN public.plc_live_data.pellet2_temp IS 'Pellet 2 temperature (°C)';
COMMENT ON COLUMN public.plc_live_data.pellet3_temp IS 'Pellet 3 temperature (°C)';

-- Grant permissions (adjust as needed for your setup)
GRANT ALL PRIVILEGES ON TABLE public.plc_live_data TO postgres;
GRANT USAGE, SELECT ON SEQUENCE public.plc_live_data_id_seq TO postgres;
