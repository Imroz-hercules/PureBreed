# PLC Reports Page

## Overview
The PLC Reports page provides real-time monitoring and historical data analysis for PLC (Programmable Logic Controller) systems in the NFM (Nutrient Feed Management) application.

## Features

### 🔄 Real-time Data Monitoring
- Live PLC data streaming with 5-second refresh intervals
- Real-time connection status indicators
- Live mode toggle for continuous data updates

### 📊 Multiple Database Views
- **DB4 - Pellet Production Data**: Pellet production metrics, temperatures, and power consumption
- **DB3 - Mill Operation Data**: Hammer mill and roller mill operations, motor speeds, vibration levels
- **DB2 - Process Control Data**: Flow rates, pressure, temperature, pH, conductivity measurements

### 🎛️ Data Filtering & Controls
- Date range filtering (start/end dates)
- View modes: Live, Historical, Alarms
- Live data streaming toggle
- Real-time status badges for system and alarm states

### 🚨 Status Monitoring
- System status indicators (Running, Stopped, Warning, Error)
- Alarm status monitoring (Normal, Warning, Critical)
- Connection status with visual indicators
- Last update timestamps

## Data Structure

### DB4 - Pellet Production Data
- `Pellet1_TonHr`, `Pellet2_TonHr`, `Pellet3_TonHr`: Production rates
- `Pellet1_KwTon`, `Pellet2_KwTon`, `Pellet3_KwTon`: Power consumption per ton
- `Pellet1_Temp`, `Pellet2_Temp`, `Pellet3_Temp`: Temperature readings
- `System_Status`: Current system operational status
- `Alarm_Status`: Current alarm state

### DB3 - Mill Operation Data
- `HammerMill_KW`, `RollerMill_KW`: Power consumption
- `Motor_Speed`: Motor RPM readings
- `Vibration_Level`: Vibration sensor readings
- `Oil_Pressure`: Oil pressure measurements
- `System_Status`, `Alarm_Status`: Status indicators

### DB2 - Process Control Data
- `Flow_Rate`: Process flow rate measurements
- `Pressure`: System pressure readings
- `Temperature`: Process temperature
- `Level`: Tank/container level measurements
- `pH_Value`: pH sensor readings
- `Conductivity`: Conductivity measurements
- `System_Status`, `Alarm_Status`: Status indicators

## Navigation
- **Route**: `/plc-reports`
- **Sidebar Icon**: CPU icon
- **Menu Label**: "PLC Reports"
- **Description**: "Real-time PLC Data & System Status"

## Technical Implementation

### Components Used
- `WaterSystemLayout`: Main layout wrapper
- `Card`, `CardContent`, `CardHeader`, `CardTitle`: Content containers
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`: Tab navigation
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`: Data tables
- `Badge`: Status indicators
- `Alert`, `AlertDescription`: Connection status alerts
- `Button`, `Input`: Interactive controls

### State Management
- `activeRange`: Current view mode (live/historical/alarms)
- `startDate`, `endDate`: Date filtering
- `plcStatus`: Connection and update status
- `isLiveMode`: Live streaming toggle state

### Data Sources
Currently uses dummy data for demonstration. In production, this would connect to:
- Real PLC systems via OPC UA, Modbus, or similar protocols
- Historical database for trend analysis
- WebSocket connections for real-time updates

## Future Enhancements
- Integration with real PLC systems
- Chart visualizations for trend analysis
- Export functionality for reports
- Alarm history and management
- Custom dashboard widgets
- Mobile-responsive design improvements

## Dependencies
- React hooks (useState, useEffect)
- date-fns for date formatting
- Lucide React for icons
- Tailwind CSS for styling
- Shadcn/ui components
