# 🚀 Backend Integration Guide

## 📋 Overview

The NFM Frontend is now fully integrated with the Hercules Backend API. All pages (Admin, BatchCalendar, Reports, Dashboard, KPIDashboard) are connected to real backend endpoints and database data.

## 🔗 API Endpoints

### Core KPI & Reports
- **`GET /api/kpi`** - Fetch KPI data with filters
- **`GET /api/reports`** - Fetch aggregated report data (daily/weekly/monthly)
- **`GET /api/kpi/csv-format-report`** - Fetch data for CSV export

### Calendar Data
- **`GET /api/kpi_calendar`** - Fetch calendar data for BatchCalendar page

### Admin Functions
- **`POST /api/logo`** - Upload company logo
- **`GET /api/logo`** - Get uploaded logos
- **`POST /api/settings/smtp`** - Save SMTP settings
- **`GET /api/settings/smtp-profiles`** - Get SMTP profiles
- **`POST /api/settings/smtp-profiles`** - Add new SMTP profile
- **`POST /api/settings/smtp-profiles/activate`** - Activate SMTP profile
- **`POST /api/settings/send-test-email`** - Send test email

## 🗄️ Database Requirements

### Required Table: `dbo.BatchMaterials`

```sql
CREATE TABLE dbo.BatchMaterials (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    [Source Server] NVARCHAR(255),
    [Batch GUID] UNIQUEIDENTIFIER,
    [ROOTGUID] UNIQUEIDENTIFIER,
    [OrderId] INT,
    [Batch Name] NVARCHAR(255),
    [Product Name] NVARCHAR(255),
    [Batch Act Start] DATETIME,
    [Batch Act End] DATETIME,
    [Batch Transfer Time] DATETIME,
    [Quantity] FLOAT,
    [Material Name] NVARCHAR(255),
    [Material Code] NVARCHAR(255),
    [SetPoint Float] FLOAT,
    [Actual Value Float] FLOAT,
    [FormulaCategoryName] NVARCHAR(255)
);
```

## 🛠️ Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd hercules-backend

# Install dependencies
pip install -r requirements.txt

# Set up database connection in config.py
# Update SQLALCHEMY_DATABASE_URI with your SQL Server details

# Create the BatchMaterials table in your database
# Use the SQL script provided above

# Start the backend server
python app.py
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd NFM-Frontend/client

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Test Integration

```bash
# Run the backend test script
node test-backend.js
```

## 📊 Frontend-Backend Integration Details

### Admin Page (`/admin`)
- **Logo Upload**: Connected to `/api/logo` endpoint
- **SMTP Settings**: Connected to `/api/settings/smtp` endpoints
- **SMTP Profiles**: Connected to `/api/settings/smtp-profiles` endpoints
- **Test Email**: Connected to `/api/settings/send-test-email` endpoint

### BatchCalendar Page (`/batch-calendar`)
- **Calendar Data**: Connected to `/api/kpi_calendar` endpoint
- **Date Filtering**: Real-time data fetching based on date range
- **Dynamic Display**: Shows tons, products, batches, and actual kg

### Reports Page (`/reports`)
- **All Report Types**: Connected to `/api/kpi` and `/api/reports` endpoints
- **Filtering**: Real-time filtering by date, product, batch, material
- **Data Aggregation**: Client-side aggregation for summary reports
- **CSV Export**: Connected to `/api/kpi/csv-format-report` endpoint

### Dashboard & KPIDashboard Pages
- **KPI Data**: Connected to `/api/kpi` endpoint
- **Real-time Updates**: Automatic data refresh
- **Filtering**: Date range and product filtering

## 🔧 API Service Functions

The frontend uses a centralized API service (`src/lib/api.ts`) with the following functions:

### KPI & Reports
- `apiService.getKPIData(filters)` - Fetch KPI data
- `apiService.getReportData(filters, reportType)` - Fetch report data
- `apiService.getCSVFormatReport(filters)` - Fetch CSV data

### Admin Functions
- `apiService.uploadLogo(file)` - Upload logo
- `apiService.getLogos(page, limit)` - Get logos
- `apiService.saveSMTPSettings(settings)` - Save SMTP settings
- `apiService.getSMTPProfiles(page, limit)` - Get SMTP profiles
- `apiService.addSMTPProfile(profile)` - Add SMTP profile
- `apiService.activateSMTPProfile(name)` - Activate profile
- `apiService.sendTestEmail(recipient)` - Send test email

### Calendar Functions
- `apiService.getCalendarData(startDate, endDate)` - Get calendar data

## 🎨 UI Features

### Loading States
- All API calls show loading spinners
- Disabled buttons during API calls
- Loading messages for better UX

### Error Handling
- Comprehensive error messages
- User-friendly error display
- Console logging for debugging

### Success Feedback
- Success messages for user actions
- Visual feedback for completed operations
- Automatic form clearing after success

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS settings in `hercules-backend/app.py`
   - Ensure frontend URL is in allowed origins

2. **Database Connection Errors**
   - Verify SQL Server connection string in `config.py`
   - Check if database server is running
   - Ensure `BatchMaterials` table exists

3. **API Endpoint Not Found**
   - Check if backend is running on port 5000
   - Verify blueprint registration in `app.py`
   - Check route imports and registrations

4. **Frontend Not Loading Data**
   - Check browser console for errors
   - Verify API_BASE_URL in `src/lib/api.ts`
   - Test endpoints manually with browser

### Debug Commands

```bash
# Test backend endpoints
curl http://localhost:5000/
curl http://localhost:5000/api/kpi?startDate=2025-06-01&endDate=2025-06-30

# Check backend logs
tail -f hercules-backend/app.log

# Test database connection
python -c "
from hercules-backend.config import Config
from sqlalchemy import create_engine
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
with engine.connect() as conn:
    result = conn.execute('SELECT COUNT(*) FROM dbo.BatchMaterials')
    print(f'Records in BatchMaterials: {result.fetchone()[0]}')
"
```

## 📈 Performance Optimizations

1. **Pagination**: API endpoints support pagination for large datasets
2. **Caching**: Frontend caches API responses where appropriate
3. **Debouncing**: Date filters use debouncing to prevent excessive API calls
4. **Error Boundaries**: React error boundaries catch and handle errors gracefully

## 🔐 Security Considerations

1. **CORS**: Properly configured CORS for frontend-backend communication
2. **Input Validation**: Backend validates all input parameters
3. **Error Handling**: Sensitive error information is not exposed to frontend
4. **File Upload**: Logo uploads are validated for file type and size

## 🚀 Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Deploy to production server
4. Update CORS origins for production domain

### Frontend Deployment
1. Update API_BASE_URL for production
2. Build production bundle
3. Deploy to web server or CDN
4. Configure reverse proxy if needed

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs in `app.log`
3. Check browser console for frontend errors
4. Test individual API endpoints manually
5. Verify database connectivity and data

---

**🎉 Integration Complete!** Your NFM Frontend is now fully connected to the Hercules Backend with real-time data, comprehensive error handling, and a modern user experience. 