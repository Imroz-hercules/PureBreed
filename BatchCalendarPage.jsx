import React, { useState, useEffect } from 'react';
import YieldCalendarChart from './YieldCalendarChart';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  Container,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DayDetailsModal from './DayDetailsModal';
import BarChartIcon from '@mui/icons-material/BarChart';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Divider from '@mui/material/Divider';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

function getDateRangeArray(start, end) {
  if (!start || !end) return [];
  const arr = [];
  let dt = new Date(start);
  dt.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (dt <= endDate) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

function getPreviousMonthRange() {
  const today = new Date();
  const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  return [firstDayPrevMonth, lastDayPrevMonth];
}

const BatchCalendarPage = () => {
  const [calendarData, setCalendarData] = useState({});
  const [selectedStartDate, setSelectedStartDate] = useState(() => getPreviousMonthRange()[0]);
  const [selectedEndDate, setSelectedEndDate] = useState(() => getPreviousMonthRange()[1]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allKpiData, setAllKpiData] = useState([]);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      let apiUrl = "/api/kpi_calendar";
      const params = new URLSearchParams();
      params.append('startDate', selectedStartDate.toISOString().slice(0, 10));
      params.append('endDate', selectedEndDate.toISOString().slice(0, 10));
      apiUrl += '?' + params.toString();

      const response = await axios.get(apiUrl);
      let data = response.data;
      if (typeof data === "string") {
        data = JSON.parse(data.replace(/NaN/g, "null"));
      }
      if (!Array.isArray(data)) {
        if (Array.isArray(data.result)) data = data.result;
        else if (Array.isArray(data.data)) data = data.data;
        else return;
      }
      // // Debug: Print the raw API response data
      // console.log('[DEBUG] /api/kpi_calendar response:', data);
      setAllKpiData(data);

      // Build calendarData: key = day, value = [tonnage, productCount, batchCount]
      const calendarDataByDay = {};
      data.forEach((item) => {
        const dateObj = new Date(item.date);
        const day = dateObj.getDate();
        calendarDataByDay[day] = [
          Math.round(item.total_actual_ton),
          item.product_count || 0,
          item.batch_count || 0
        ];
      });
      // Debug: Print the processed calendarDataByDay
      // console.log('[DEBUG] calendarDataByDay:', calendarDataByDay);
      setCalendarData(calendarDataByDay);
      setLoading(false);
    };
    fetchData();
  }, [selectedStartDate, selectedEndDate]);

  const handleDayClick = async (dateObj) => {
    const dayStart = new Date(dateObj);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateObj);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch raw KPI data for this day
    const params = new URLSearchParams();
    params.append('startDate', dayStart.toISOString());
    params.append('endDate', dayEnd.toISOString());
    params.append('strictDateFilter', 'true');
    params.append('page', 'all');
    params.append('limit', 'none');
    
    const apiUrl = `/api/kpi?${params.toString()}`;

    try {
      const response = await axios.get(apiUrl);
      let data = response.data;
      if (typeof data === "string") {
        data = JSON.parse(data.replace(/NaN/g, "null"));
      }
      if (!Array.isArray(data)) {
        if (Array.isArray(data.result)) data = data.result;
        else if (Array.isArray(data.data)) data = data.data;
        else data = [];
      }
      setSelectedDayDetails({ date: dateObj, data });
      setPopupOpen(true);
    } catch (error) {
      setSelectedDayDetails({ date: dateObj, data: [] });
      setPopupOpen(true);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: darkMode ? '#181C1F' : '#f4f7fa', py: 0,mt:12 }}>
      {/* Sticky Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: darkMode ? '#181C1F' : '#f4f7fa',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        py: 2,
        mb: 2
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
              <CalendarMonthOutlinedIcon sx={{ fontSize: 36, color: darkMode ? '#fff' : '#1976D2', mr: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: darkMode ? '#fff' : '#222', letterSpacing: 1 }}>
                Batch Calendar
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={selectedStartDate}
                  onChange={(date) => setSelectedStartDate(date)}
                  slotProps={{ textField: { size: 'small', variant: 'outlined', sx: { minWidth: 120, background: darkMode ? '#23272A' : '#fff', borderRadius: 2 } } }}
                />
                <DatePicker
                  label="End Date"
                  value={selectedEndDate}
                  onChange={(date) => setSelectedEndDate(date)}
                  slotProps={{ textField: { size: 'small', variant: 'outlined', sx: { minWidth: 120, background: darkMode ? '#23272A' : '#fff', borderRadius: 2 } } }}
                />
              </LocalizationProvider>
              
            </Box>
          </Box>
        </Container>
      </Box>
      {/* Calendar Grid */}
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 }, mx: 'auto', pb: 4 }}>
        <Box sx={{ width: '100%', mt: 2 }}>
          {/* Responsive grid using CSS grid for modern look */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(7, 1fr)' },
              gap: 2,
              minHeight: 400,
            }}
          >
            {getDateRangeArray(selectedStartDate, selectedEndDate).map((dateObj, idx) => {
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString('default', { month: 'short' });
              const isToday = new Date().toDateString() === dateObj.toDateString();
              const [tonnage = 0, productCount = 0, batchCount = 0] = calendarData[day] || [];
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              return (
                <Box
                  key={dateObj.toISOString()}
                  onClick={() => handleDayClick(dateObj)}
                  sx={{
                    borderRadius: 3,
                    boxShadow: isToday ? '0 4px 16px rgba(33,150,243,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
                    background: darkMode ? (isToday ? '#23272A' : '#20232A') : (isToday ? '#e3f2fd' : '#fff'),
                    p: 2,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: isToday ? '2px solid #1976D2' : '1px solid #222',
                    transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), border 0.2s, transform 0.25s cubic-bezier(.25,.8,.25,1)',
                    '&:hover': {
                      boxShadow: darkMode
                        ? '0 0 24px 8px #1976D2, 0 16px 48px 0 rgba(33,150,243,0.35), 0 2px 8px rgba(0,0,0,0.12)'
                        : '0 0 24px 8px #bdbdbd, 0 16px 48px 0 rgba(189,189,189,0.25), 0 2px 8px rgba(0,0,0,0.10)',
                      background: darkMode ? '#23272A' : '#f5faff',
                      border: '2px solid #1976D2',
                      transform: 'translateY(-6px) scale(1.04)',
                    },
                  }}
                >
                  {/* Day name and underline */}
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: darkMode ? '#fff' : '#222', mb: 0.5, letterSpacing: 0.5, textAlign: 'center' }}>
                    {dayName}
                  </Typography>
                  <Divider sx={{ width: '80%', borderBottomWidth: 2, borderColor: darkMode ? '#fff' : '#222', mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkMode ? '#fff' : '#222', mb: 0.5, letterSpacing: 0.5 }}>
                    {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <BarChartIcon sx={{ color: tonnage > 0 ? '#43a047' : '#d32f2f', fontSize: 22 }} />
                    {loading ? (
                      <CircularProgress size={16} sx={{ color: '#1976D2' }} />
                    ) : (
                      <Typography variant="h6" fontWeight="bold" sx={{ color: tonnage > 0 ? '#43a047' : '#d32f2f' }}>{tonnage} ton</Typography>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Inventory2OutlinedIcon sx={{ color: '#1976D2', fontSize: 20 }} />
                    {loading ? (
                      <CircularProgress size={14} sx={{ color: '#1976D2' }} />
                    ) : (
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#1976D2' }}>{productCount} products</Typography>
                    )}
                  </Box>
                  {/* Debug: Show batch count */}
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    {loading ? (
                      <CircularProgress size={14} sx={{ color: '#d32f2f' }} />
                    ) : (
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                        {batchCount} batches
                      </Typography>
                    )}
                  </Box>
                  {/* Placeholder for future mini chart */}
                  {/* <Box sx={{ width: '100%', mt: 1 }}>
                    <MiniBarChart data={...} />
                  </Box> */}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Container>
      {/* Modal for day details, styled to match new look */}
      <DayDetailsModal open={popupOpen} onClose={() => setPopupOpen(false)} dayDetails={selectedDayDetails} />
    </Box>
  );
};

export default BatchCalendarPage;
