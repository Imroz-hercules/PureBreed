import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import { Pie, Line, Bar, Doughnut } from "react-chartjs-2";
import { LineChart } from "@mui/x-charts/LineChart";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Filler,
} from "chart.js";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Diversity2OutlinedIcon from "@mui/icons-material/Diversity2Outlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import Brightness7OutlinedIcon from "@mui/icons-material/Brightness7Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EfficiencyAndComplexityCharts from './EfficiencyAndComplexityCharts';
import YieldBoxChartTopMaterials from './YieldBoxChartTopMaterials';
import YieldVsActualValueChart from './YieldVsActualValueChart';
import YieldVsQuantityChart from './YieldVsQuantityChart';
import YieldVsSetPointChart from './YieldVsSetPointChart';
import KPIImportanceChart from './KPIImportanceChart';
import YieldCalendarChart from './YieldCalendarChart';

import "../App.css";
import { useRef } from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-3d';
//syed mahesh

ChartJS.register(
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler
);

const centerTextPlugin = {
  id: "centerText",
  afterDraw: (chart) => {
    if (chart.config.type === "doughnut") {
      const { ctx, chartArea } = chart;
      ctx.save();
      const fontSize = Math.min(chart.width, chart.height) / 12;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      const total = chart.config.data.labels?.length || 0;
      const text = `${total} Product${total !== 1 ? "s" : ""}`;
      // Use the center of the chart area (the white circle)
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      ctx.fillText(text, centerX, centerY);
      ctx.restore();
    }
  },
};

// Helper to get all dates in range
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

// Helper to convert hex color to rgba
function hexToRgba(hex, alpha = 0.2) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// Maximally distinct, colorblind-friendly palette (Tableau 20)
const distinctPalette = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
  "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
  "#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD",
  "#8C564B", "#E377C2", "#7F7F7F", "#BCBD22", "#17BECF"
];

const getDistinctColors = (count) => {
  const repeats = Math.ceil(count / distinctPalette.length);
  return Array(repeats).fill(distinctPalette).flat().slice(0, count);
};

const Dashboard = () => {
  const [kpiData, setKpiData] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [barDataLotTracking, setBarDataLotTracking] = useState(null);
  const [barDataProduction, setBarDataProduction] = useState(null);
  const [donutData, setDonutData] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [batchNames, setBatchNames] = useState([]);
  const [selectedBatchName, setSelectedBatchName] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState([]);
  const [materialNames, setMaterialNames] = useState([]);
  const [selectedCardBgColor, setSelectedCardBgColor] = useState(() => {
    // Load the saved color theme from localStorage, default to "White" if not found
    const savedColor = localStorage.getItem('selectedCardBgColor');
    return savedColor || "White";
  });
  const [lineStrokeColor, setLineStrokeColor] = useState("#33691e");
  const [pointFillColor, setPointFillColor] = useState("#a2cb74");
  const [gradientColors, setGradientColors] = useState([]);
  const [historicalBarData, setHistoricalBarData] = useState(null);
  const [viewReport, setViewReport] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(true);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [secondAnchorEl, setSecondAnchorEl] = useState(null);
  const [thirdAnchorEl, setThirdAnchorEl] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [throughputData, setThroughputData] = useState([]);
const [complexityData, setComplexityData] = useState([]);
const [yieldVsQuantityData, setYieldVsQuantityData] = useState([]);
const [yieldVsActualValueData, setYieldVsActualValueData] = useState([]);
const [yieldVsSetPointData, setYieldVsSetPointData] = useState([]);
const [yieldBoxTopMaterialsData, setYieldBoxTopMaterialsData] = useState([]);
const [kpiImportanceData, setKpiImportanceData] = useState([]);
const [calendarData, setCalendarData] = useState({});

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Set default monthly date range on component mount
  useEffect(() => {
    const today = new Date();
    
    // Set start date to first day of previous month at 7 AM
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    startDate.setHours(7, 0, 0, 0);

    // Set end date to last day of previous month at 7 AM
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    endDate.setHours(7, 0, 0, 0);

    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    
    // No need to call applyFilters explicitly since initialLoadComplete is true
    // and the useEffect that depends on it will trigger the data fetch
  }, []);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    const selected = typeof value === "string" ? value.split(",") : value;
    
    // Handle Select All / Deselect All
    if (selected.includes("all")) {
      if (selectedMaterial.length === materialNames.length) {
        setSelectedMaterial([]);
      } else {
        setSelectedMaterial([...materialNames]);
      }
    } else {
      // Handle multi-selection correctly
      setSelectedMaterial(selected);
    }
  };

  const dashboardRef = useRef();
  const bgColorOptions = [
    { name: "White", hex: "#ffffff" },
    { name: "Mint", hex: "#90ee90" },
    { name: "Steel Gray", hex: "#2F4F4F" },
    { name: "Charcoal", hex: "#36454F" },
    { name: "Slate Blue", hex: "#6A7FDB" },
    { name: "Olive Drab", hex: "#6B8E23" },
    { name: "Rust Red", hex: "#8B0000" },
    { name: "Safety Orange", hex: "#FF6F00" },
    { name: "Industrial Yellow Dark", hex: "#D4A628" },
    { name: "Midnight Blue", hex: "#191970" },
    { name: "Cobalt Blue", hex: "#0047AB" },
  ];
  // const throughputData = [
  //   { product: 'Product A', throughput: 18.2 },
  //   { product: 'Product B', throughput: 14.7 },
  //   { product: 'Product C', throughput: 11.9 },
  // ];

  // const complexityData = [
  //   { product: 'Product A', uniqueMaterials: 6 },
  //   { product: 'Product B', uniqueMaterials: 4 },
  //   { product: 'Product C', uniqueMaterials: 8 },
  // ];
  
  const colorOptions = [
    { name: "Cool White", hex: "#F9F9F9" },
    { name: "Steel Gray", hex: "#2F4F4F" },
    { name: "Charcoal", hex: "#36454F" },
    { name: "Slate Blue", hex: "#6A7FDB" },
    { name: "Olive Drab", hex: "#6B8E23" },
    { name: "Rust Red", hex: "#8B0000" },
    { name: "Safety Orange", hex: "#FF6F00" },
    { name: "Industrial Yellow", hex: "#F4C542" },
    { name: "Concrete Gray", hex: "#D3D3D3" },
    { name: "Midnight Blue", hex: "#191970" },
    { name: "Cobalt Blue", hex: "#0047AB" },
    { name: "Jet Black", hex: "#000000" },
  ];

  const getHexByName = (name) => {
    const allOptions = [...colorOptions, ...bgColorOptions];
    const found = allOptions.find((c) => c.name === name);
    return found ? found.hex : "#000000";
  };

  const getTextColorForBackground = (colorName) => {
    const hex = getHexByName(colorName);
    const lightBackgrounds = [
      "#ffffff",
      "#ffefef",
      "#f8f9fa",
      "#fce4ec",
      "#ede7f6",
      "#fff3e0",
      "#90ee90",
    ];
    return lightBackgrounds.includes(hex.toLowerCase()) ? "#1a1a1a" : "#ffffff";
  };

  const getGradientColors = (baseColorHex, count = 12) => {
    const colors = [];
    
    // Parse the base color
    const base = baseColorHex.replace("#", "");
    const baseR = parseInt(base.substring(0, 2), 16);
    const baseG = parseInt(base.substring(2, 4), 16);
    const baseB = parseInt(base.substring(4, 6), 16);
    
    // Convert RGB to HSL for better color manipulation
    const rgbToHsl = (r, g, b) => {
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return [h * 360, s * 100, l * 100];
    };
    
    // Convert HSL to RGB
    const hslToRgb = (h, s, l) => {
      h /= 360;
      s /= 100;
      l /= 100;
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      const hueToRgb = (t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      return [
        Math.round(hueToRgb(h + 1/3) * 255),
        Math.round(hueToRgb(h) * 255),
        Math.round(hueToRgb(h - 1/3) * 255)
      ];
    };
    
    // Get base HSL values
    const [baseH, baseS, baseL] = rgbToHsl(baseR, baseG, baseB);
    
    // Industrial color palette - darker, muted tones
    const industrialHues = [
      baseH,                    // Theme color
      (baseH + 30) % 360,      // Analogous
      (baseH + 60) % 360,      // Analogous
      (baseH + 180) % 360,     // Complementary
      (baseH + 210) % 360,     // Split complementary
      (baseH + 330) % 360,     // Split complementary
      0,                        // Red
      30,                       // Orange
      60,                       // Yellow
      120,                      // Green
      240,                      // Blue
      300                       // Purple
    ];
    
    // Generate industrial gradient colors
    for (let i = 0; i < count; i++) {
      const factor = i / Math.max(count - 1, 1);
      
      // Select industrial hue
      const hueIndex = i % industrialHues.length;
      let h = industrialHues[hueIndex];
      
      // Add subtle variation to hue
      h = (h + (i * 5) + (Math.random() - 0.5) * 10) % 360;
      
      // Industrial saturation - more muted, less vibrant
      const s = Math.max(25, Math.min(70, 45 + (Math.sin(i * 0.8) * 15) + (Math.random() - 0.5) * 10));
      
      // Industrial lightness - darker range for industrial feel
      const l = Math.max(15, Math.min(65, 35 + (Math.cos(i * 0.6) * 20) + (Math.random() - 0.5) * 15));
      
      // Convert back to RGB
      const [r, g, b] = hslToRgb(h, s, l);
      
      // Apply industrial darkening filter
      const darkenFactor = 0.85; // Make colors 15% darker
      const industrialR = Math.round(r * darkenFactor);
      const industrialG = Math.round(g * darkenFactor);
      const industrialB = Math.round(b * darkenFactor);
      
      // Add slight desaturation for industrial feel
      const grayFactor = 0.1; // 10% gray added
      const gray = Math.round((industrialR + industrialG + industrialB) / 3 * grayFactor);
      const finalR = Math.round(industrialR * (1 - grayFactor) + gray);
      const finalG = Math.round(industrialG * (1 - grayFactor) + gray);
      const finalB = Math.round(industrialB * (1 - grayFactor) + gray);
      
      colors.push(`rgb(${finalR}, ${finalG}, ${finalB})`);
    }

    return colors;
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSecondAnchorEl(null);
    setThirdAnchorEl(null);
  };

  const handleStartDateChange = (newDate) => {
    if (newDate) {
      // Preserve the time (7 AM) when changing the date
      const updatedDate = new Date(newDate);
      updatedDate.setHours(7, 0, 0, 0);
      setSelectedStartDate(updatedDate);
    }
  };

  const handleEndDateChange = (newDate) => {
    if (newDate) {
      // Preserve the time (7 AM) when changing the date
      const updatedDate = new Date(newDate);
      updatedDate.setHours(7, 0, 0, 0);
      setSelectedEndDate(updatedDate);
    }
  };

  const applyFilters = () => {
    // console.log("Filters applied:", {
    //   selectedStartDate,
    //   selectedEndDate,
    //   selectedBatchName,
    //   selectedProduct,
    //   selectedMaterial,
    // });
    // Set the initialLoadComplete flag to true when View is clicked
    setInitialLoadComplete(true);
    // Force re-fetch of data with current filters
    setRefreshFlag((prev) => !prev);
  };

  // Function to get API date with offset applied
  const getApiDateWithOffset = (displayDate) => {
    if (!displayDate) return null;
    // Create a new date object to avoid modifying the original
    const apiDate = new Date(displayDate);
    // Subtract 4 hours from the display date for API calls
    apiDate.setHours(apiDate.getHours() - 4);
    return apiDate;
  };

  function isFiniteNumber(val) {
    return typeof val === 'number' && isFinite(val) || (!isNaN(val) && val !== null && val !== '' && isFinite(Number(val)));
  }

  function calculateKPIsAndCharts(data) {
    if (!Array.isArray(data)) return;

    const totalMaterialsDosed = data.length; // Each row = one material dosed
    const totalBatches = new Set(data.map(item => item["Batch GUID"])).size;
    const uniqueProductsSet = new Set();
    const productCounts = {};
    // Throughput = Number of batches per product (already in productCounts)
const computedThroughputData = Object.entries(productCounts).map(
  ([product, count]) => ({ product, throughput: count })
);

// Complexity = Unique material count per product
const productMaterialMap = {};
data.forEach(item => {
  const product = item["Product Name"];
  const material = item["Material Name"];
  if (product && material) {
    if (!productMaterialMap[product]) {
      productMaterialMap[product] = new Set();
    }
    productMaterialMap[product].add(material);
  }
});
const computedComplexityData = Object.entries(productMaterialMap).map(
  ([product, materialsSet]) => ({ product, uniqueMaterials: materialsSet.size })
);

// Set them into state
setThroughputData(computedThroughputData);
setComplexityData(computedComplexityData);

    const batchTimeline = {};
    const orderStatusCounts = {
      Completed: 0,
      Pending: 0,
      InProgress: 0,
      Cancelled: 0,
    };

    let totalCompletionTime = 0;
    let plannedCompletionTime = 0;
    let totalMaterialUsage = 0;
    let totalSetPointUsage = 0;
    let accurateBatches = 0;
    let completedOrders = 0;
    let totalOrders = 0;
    let orderBacklogCount = 0;

    data.forEach((item) => {
      if (item["Product Name"]) {
        uniqueProductsSet.add(item["Product Name"]);
        productCounts[item["Product Name"]] =
          (productCounts[item["Product Name"]] || 0) + 1;
      }

      if (item["Order Status"]) {
        orderStatusCounts[item["Order Status"]] =
          (orderStatusCounts[item["Order Status"]] || 0) + 1;
      }

      if (
        item["Batch Act Start"] !== "N/A" &&
        item["Batch Act End"] !== "N/A"
      ) {
        const batchStart = new Date(item["Batch Act Start"]);
        const batchEnd = new Date(item["Batch Act End"]);
        if (!isNaN(batchStart) && !isNaN(batchEnd)) {
          const batchTime = (batchEnd - batchStart) / (1000 * 60);
          totalCompletionTime += batchTime;
          plannedCompletionTime += item["Planned Batch Completion Time"] || 0;
        }
      }

      totalMaterialUsage += item["Actual Material Usage"] || 0;
      totalSetPointUsage += item["SetPoint Material Usage"] || 0;

      if (
        Math.abs(
          (item["Actual Material Usage"] || 0) - (item["SetPoint"] || 0)
        ) <= (item["Tolerance"] || 0)
      ) {
        accurateBatches++;
      }

      if (item["Order Status"] === "Completed") {
        completedOrders++;
      }
      if (item["Order Status"]) {
        totalOrders++;
      }
      if (item["Order Status"] === "Pending") {
        orderBacklogCount++;
      }

      // FIXED: Count unique batches per day, not materials
      if (item["Batch Act Start"] !== "N/A") {
        const batchDate = new Date(item["Batch Act Start"]);
        // Only include batchDate if it is within the selected date range
        if (
          !isNaN(batchDate) &&
          selectedStartDate &&
          selectedEndDate &&
          batchDate >= new Date(selectedStartDate.setHours(0,0,0,0)) &&
          batchDate <= new Date(selectedEndDate.setHours(23,59,59,999))
        ) {
          const formattedDate = batchDate.toDateString();
          const batchGUID = item["Batch GUID"] || "unknown";
          
          // Initialize batch set for this date if it doesn't exist
          if (!batchTimeline[formattedDate]) {
            batchTimeline[formattedDate] = new Set();
          }
          // Add this batch GUID to the set for this date
          batchTimeline[formattedDate].add(batchGUID);
        }
      }
    });

    // Convert batch sets to counts
    Object.keys(batchTimeline).forEach(date => {
      batchTimeline[date] = batchTimeline[date].size;
    });

    // After filling batchTimeline, ensure all dates in the selected range are present with 0 if missing
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate.getTime());
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedEndDate.getTime());
      end.setHours(0, 0, 0, 0);
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toDateString();
        if (!(formattedDate in batchTimeline)) {
          batchTimeline[formattedDate] = 0;
        }
      }
    }
    // Sort batchTimeline by date and filter out any date before selectedStartDate
    const sortedBatchTimeline = Object.keys(batchTimeline)
      .map(dateStr => new Date(dateStr))
      .filter(dateObj => dateObj >= new Date(selectedStartDate.setHours(0,0,0,0)))
      .sort((a, b) => a - b)
      .map(dateObj => dateObj.toDateString());
    const filteredBatchTimeline = {};
    for (const dateStr of sortedBatchTimeline) {
      filteredBatchTimeline[dateStr] = batchTimeline[dateStr];
    }

    const uniqueMaterialNames = Array.from(
      new Set(data.map((item) => item["Material Name"]).filter((name) => name))
    );
    setMaterialNames(uniqueMaterialNames);

    const uniqueProducts = uniqueProductsSet.size || 1;
    const batchesPerProduct = (totalBatches / uniqueProducts).toFixed(2);
    // Find the most recent (latest) valid Batch Act Start date
    let latestBatchDate = "N/A";
    const validBatchDates = data
      .map(item => item["Batch Act Start"])
      .filter(dateStr => dateStr && dateStr !== "N/A" && !isNaN(new Date(dateStr)));
    if (validBatchDates.length > 0) {
      const maxDate = new Date(Math.max(...validBatchDates.map(dateStr => new Date(dateStr).getTime())));
      latestBatchDate = maxDate.toDateString();
    }

    setKpiData([
      {
        title: "Unqiue Batche GUIDs",
        value: totalBatches,
        color: "#3f51b5",
        percentage: 10,
      },
      {
        title: "Total Materials Dosed", // ✅ NEW KPI
        value: totalMaterialsDosed,     // Make sure this is defined earlier as: data.length
        color: "#e91e63",               // Use any color you'd like
        percentage: 0,                  // Or calculate change if applicable
      },
      {
        title: "Unique Products",
        value: uniqueProducts,
        color: "#4caf50",
        percentage: 5,
      },
      {
        title: "Batches per Product",
        value: batchesPerProduct,
        color: "#ffb300",
        percentage: -2,
      },
      {
        title: "Latest Batch Date",
        value: latestBatchDate,
        color: "#0097a7",
        percentage: 0,
      },
    ]);

    // Generate unique colors for each chart based on their data count
    const productColors = getDistinctColors(Object.keys(productCounts).length);
    const timelineColors = getDistinctColors(Object.keys(filteredBatchTimeline).length);
    const weekdayColors = getDistinctColors(7); // 7 days of week
    
    // Initialize lotTrackingTimeline and historicalTimeline before using them
    const lotTrackingData = {};
    data.forEach((item) => {
      const batchDate = new Date(item["Batch Act Start"]).toDateString();
      const lotNumber = item["Lot Number"] || "Unknown";

      if (!lotTrackingData[batchDate]) {
        lotTrackingData[batchDate] = new Set();
      }
      lotTrackingData[batchDate].add(lotNumber);
    });

    // For Lot Tracking Over Time, filter out any date before selectedStartDate
    const lotTrackingTimeline = {};
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate.getTime());
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedEndDate.getTime());
      end.setHours(0, 0, 0, 0);
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toDateString();
        lotTrackingTimeline[formattedDate] = 0;
      }
    }
    Object.entries(lotTrackingData).forEach(([date, lots]) => {
      lotTrackingTimeline[date] = lots.size;
    });
    const sortedLotTrackingTimeline = Object.keys(lotTrackingTimeline)
      .map(dateStr => new Date(dateStr))
      .filter(dateObj => dateObj >= new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth(), selectedStartDate.getDate(), 0, 0, 0))
      .sort((a, b) => a - b)
      .map(dateObj => dateObj.toDateString());
    const filteredLotTrackingTimeline = {};
    for (const dateStr of sortedLotTrackingTimeline) {
      filteredLotTrackingTimeline[dateStr] = lotTrackingTimeline[dateStr];
    }

    // For Historical Material dosed per day, filter out any date before selectedStartDate
    const historicalTimeline = {};
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate.getTime());
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedEndDate.getTime());
      end.setHours(0, 0, 0, 0);
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toDateString();
        historicalTimeline[formattedDate] = 0;
      }
    }
    
    // Calculate materials dosed weight per day using Actual Value Float
    data.forEach((item) => {
      if (item["Batch Act Start"] !== "N/A") {
        const batchDate = new Date(item["Batch Act Start"]);
        // Only include batchDate if it is within the selected date range
        if (
          !isNaN(batchDate) &&
          selectedStartDate &&
          selectedEndDate &&
          batchDate >= new Date(selectedStartDate.setHours(0,0,0,0)) &&
          batchDate <= new Date(selectedEndDate.setHours(23,59,59,999))
        ) {
          const formattedDate = batchDate.toDateString();
          // Step 1: Sum of Actual Value Float for each material
          const actualValueFloat = Number(item["Actual Value Float"] || 0);
          // Step 2: Convert to tons (kg to tons)
          const materialWeightTons = actualValueFloat / 1000;
          // Step 3: Add to daily total for all materials
          historicalTimeline[formattedDate] = (historicalTimeline[formattedDate] || 0) + materialWeightTons;
        }
      }
    });
    
    const sortedHistoricalTimeline = Object.keys(historicalTimeline)
      .map(dateStr => new Date(dateStr))
      .filter(dateObj => dateObj >= new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth(), selectedStartDate.getDate(), 0, 0, 0, 0))
      .sort((a, b) => a - b)
      .map(dateObj => dateObj.toDateString());
    const filteredHistoricalTimeline = {};
    for (const dateStr of sortedHistoricalTimeline) {
      filteredHistoricalTimeline[dateStr] = historicalTimeline[dateStr];
    }
    
    // // Debug logging for verification (moved after filteredHistoricalTimeline is defined)
    // console.log('=== Historical Material Weight Dosed per Day Debug ===');
    // console.log('Total data rows:', data.length);
    // console.log('Historical Timeline Data (weight in tons):', historicalTimeline);
    // console.log('Filtered Historical Timeline (weight in tons):', filteredHistoricalTimeline);
    // console.log('Batch Timeline Data (for comparison):', batchTimeline);
    
    // Additional verification calculations
    const totalWeightFromTimeline = Object.values(historicalTimeline).reduce((sum, weight) => sum + weight, 0);
    const totalBatchesFromTimeline = Object.values(batchTimeline).reduce((sum, count) => sum + count, 0);
    // console.log('Total weight from timeline (tons):', totalWeightFromTimeline.toFixed(2));
    // console.log('Total batches from timeline:', totalBatchesFromTimeline);
    // console.log('Average weight per batch (tons):', (totalWeightFromTimeline / totalBatchesFromTimeline).toFixed(2));
    // console.log('==============================================');

    const lotTrackingColors = getDistinctColors(Object.keys(filteredLotTrackingTimeline).length);
    const historicalColors = getDistinctColors(Object.keys(filteredHistoricalTimeline).length);
    const orderStatusColors = getDistinctColors(Object.keys(orderStatusCounts).filter(status => orderStatusCounts[status] > 0).length);

    setPieData({
      labels: Object.keys(productCounts),
      datasets: [
        {
          data: Object.values(productCounts),
          backgroundColor: productColors,
          borderWidth: 1,
        },
      ],
    });

    setBarData({
      labels: Object.keys(productCounts),
      datasets: [
        {
          label: "Batches by Product",
          data: Object.values(productCounts),
          backgroundColor: productColors,
        },
      ],
    });

    setLineData({
      labels: Object.keys(filteredBatchTimeline),
      datasets: [
        {
          label: "Batches Over Time",
          data: Object.values(filteredBatchTimeline),
          borderColor: timelineColors[0],
          backgroundColor: hexToRgba(timelineColors[0], 0.2),
          fill: true,
          tension: 0.1,
        },
      ],
    });

    const lotTrackingFormatted = Object.entries(lotTrackingData).map(
      ([date, lots]) => ({
        date,
        count: lots.size,
      })
    );

    setBarDataLotTracking({
      labels: Object.keys(filteredLotTrackingTimeline),
      datasets: [
        {
          label: "Unique Lot Numbers Per Day",
          data: Object.values(filteredLotTrackingTimeline),
          backgroundColor: getDistinctColors(Object.keys(filteredLotTrackingTimeline).length),
        },
      ],
    });

    setDonutData({
      labels: Object.keys(productCounts),
      datasets: [
        {
          data: Object.values(productCounts),
          backgroundColor: productColors,
          borderWidth: 1,
        },
      ],
    });

    setHistoricalBarData({
      labels: Object.keys(filteredHistoricalTimeline),
      datasets: [
        {
          label: "Historical Material Weight Dosed per Day (tons)",
          data: Object.values(filteredHistoricalTimeline),
          backgroundColor: getDistinctColors(Object.keys(filteredHistoricalTimeline).length),
        },
      ],
    });

    // --- Yield vs Quantity ---
    const yieldVsQuantity = data
      .filter(r => isFiniteNumber(r["Quantity"]) && isFiniteNumber(r["SetPoint Float"]) && isFiniteNumber(r["Actual Value Float"]) && r["SetPoint Float"] !== 0)
      .map(r => ({
        x: Number(r["Quantity"]),
        y: (Number(r["Actual Value Float"]) / Number(r["SetPoint Float"])) * 100
      }));
    setYieldVsQuantityData(yieldVsQuantity);

    // --- Yield vs Actual Value ---
    const yieldVsActualValue = data
      .filter(r => isFiniteNumber(r["Actual Value Float"]) && isFiniteNumber(r["SetPoint Float"]) && r["SetPoint Float"] !== 0)
      .map(r => ({
        x: Number(r["Actual Value Float"]),
        y: (Number(r["Actual Value Float"]) / Number(r["SetPoint Float"])) * 100
      }));
    setYieldVsActualValueData(yieldVsActualValue);

    // --- Yield vs SetPoint ---
    const yieldVsSetPoint = data
      .filter(r => isFiniteNumber(r["SetPoint Float"]) && isFiniteNumber(r["Actual Value Float"]) && r["SetPoint Float"] !== 0)
      .map(r => ({
        x: Number(r["SetPoint Float"]),
        y: (Number(r["Actual Value Float"]) / Number(r["SetPoint Float"])) * 100
      }));
    setYieldVsSetPointData(yieldVsSetPoint);

    // // Debug logs
    // console.log('Yield vs Quantity:', yieldVsQuantity);
    // console.log('Yield vs Actual Value:', yieldVsActualValue);
    // console.log('Yield vs SetPoint:', yieldVsSetPoint);

    // // Debug logs for min/max
    // if (yieldVsQuantity.length) {
    //   console.log('YieldVsQuantity X min/max:', Math.min(...yieldVsQuantity.map(d=>d.x)), Math.max(...yieldVsQuantity.map(d=>d.x)));
    //   console.log('YieldVsQuantity Y min/max:', Math.min(...yieldVsQuantity.map(d=>d.y)), Math.max(...yieldVsQuantity.map(d=>d.y)));
    // }
    // if (yieldVsActualValue.length) {
    //   console.log('YieldVsActualValue X min/max:', Math.min(...yieldVsActualValue.map(d=>d.x)), Math.max(...yieldVsActualValue.map(d=>d.x)));
    //   console.log('YieldVsActualValue Y min/max:', Math.min(...yieldVsActualValue.map(d=>d.y)), Math.max(...yieldVsActualValue.map(d=>d.y)));
    // }
    // if (yieldVsSetPoint.length) {
    //   console.log('YieldVsSetPoint X min/max:', Math.min(...yieldVsSetPoint.map(d=>d.x)), Math.max(...yieldVsSetPoint.map(d=>d.x)));
    //   console.log('YieldVsSetPoint Y min/max:', Math.min(...yieldVsSetPoint.map(d=>d.y)), Math.max(...yieldVsSetPoint.map(d=>d.y)));
    // }

    // --- Yield Distribution (Top 5 Materials) ---
    const materialYields = {};
    data.forEach(r => {
      const material = r["Material Name"];
      const setPoint = r["SetPoint Float"];
      const actual = r["Actual Value Float"];
      if (material && setPoint && actual) {
        const yieldValue = (actual / setPoint) * 100;
        if (!materialYields[material]) materialYields[material] = [];
        materialYields[material].push(yieldValue);
      }
    });
    const top5 = Object.entries(materialYields)
      .map(([material, yields]) => ({ material, yields }))
      .sort((a, b) => {
        const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
        return avg(b.yields) - avg(a.yields);
      })
      .slice(0, 5);
    setYieldBoxTopMaterialsData(top5);

    // --- KPI Importance ---
    // If your backend provides feature importances, use them. Otherwise, keep as is or set dummy data.
    if (data.feature_importances) {
      setKpiImportanceData(data.feature_importances);
    } else {
      // Optionally, keep as is or set dummy data
      setKpiImportanceData([
        { feature: 'Actual Value', importance: 0.53 },
        { feature: 'SetPoint', importance: 0.35 },
        { feature: 'Quantity', importance: 0.12 },
        { feature: 'Product', importance: 0.07 },
        { feature: 'Material', importance: 0.05 },
        { feature: 'Formula Category', importance: 0.03 },
      ]);
    }

    // Calculate calendar data for YieldCalendarChart
    const calendarDataByDay = {};
    
    data.forEach((item) => {
      if (item["Batch Act Start"] && item["Batch Act Start"] !== "N/A") {
        const batchDate = new Date(item["Batch Act Start"]);
        if (!isNaN(batchDate)) {
          const day = batchDate.getDate();
          const weight = (item["Quantity"] || 0) / 1000; // convert kg to tons
          const product = item["Product Name"] || "Unknown";
          
          if (!calendarDataByDay[day]) {
            calendarDataByDay[day] = {
              totalWeight: 0,
              uniqueProducts: new Set(),
              productsList: []
            };
          }
          
          // Add weight to total for this day
          calendarDataByDay[day].totalWeight += weight;
          
          // Add product to unique products set for this day
          calendarDataByDay[day].uniqueProducts.add(product);
          calendarDataByDay[day].productsList.push(product);
        }
      }
    });
    
    // Convert to the format expected by YieldCalendarChart and log details
    const formattedCalendarData = {};
    Object.keys(calendarDataByDay).forEach(day => {
      const dayData = calendarDataByDay[day];
      // console.log(
      //   `Day: ${day}, Total Weight: ${dayData.totalWeight}, Products:`,
      //   Array.from(dayData.uniqueProducts),
      //   'All Products:', dayData.productsList
      // );
      formattedCalendarData[day] = [
        Math.round(dayData.totalWeight), // Total weight rounded to nearest integer
        dayData.uniqueProducts.size      // Number of unique products
      ];
    });
    
    setCalendarData(formattedCalendarData);

    // // Debug logging for batch count by weekday
    // console.log('=== Batch Count by Weekday Debug ===');
    // Object.entries(productionByDay).forEach(([day, count]) => {
    //   console.log(`${day}: ${count}`);
    // });
    // if (typeof weekStart !== 'undefined' && typeof weekEnd !== 'undefined') {
    //   console.log('Week Start:', weekStart.toDateString());
    //   console.log('Week End:', weekEnd.toDateString());
    // }
    // console.log('====================================');

    // Count unique batches per weekday
    const productionByDaySets = {
      Monday: new Set(),
      Tuesday: new Set(),
      Wednesday: new Set(),
      Thursday: new Set(),
      Friday: new Set(),
      Saturday: new Set(),
      Sunday: new Set(),
    };
    data.forEach((item) => {
      const batchDate = new Date(item["Batch Act Start"]);
      const dayOfWeek = batchDate.toLocaleDateString("en-US", { weekday: "long" });
      const batchGUID = item["Batch GUID"] || "unknown";
      if (productionByDaySets.hasOwnProperty(dayOfWeek)) {
        productionByDaySets[dayOfWeek].add(batchGUID);
      }
    });
    // Convert sets to counts for charting
    const productionByDay = {};
    Object.keys(productionByDaySets).forEach(day => {
      productionByDay[day] = productionByDaySets[day].size;
    });
    // Debug logging for unique batch count by weekday
    // console.log('=== Unique Batch Count by Weekday Debug ===');
    // console.log('📅 Selected Date Range:', selectedStartDate?.toLocaleDateString(), 'to', selectedEndDate?.toLocaleDateString());
    // Object.entries(productionByDay).forEach(([day, count]) => {
    //   console.log(`${day}: ${count}`);
    // });
    // console.log('====================================');
    // Set chart data after productionByDay is ready
    setBarDataProduction({
      labels: Object.keys(productionByDay),
      datasets: [
        {
          label: "No. Batches by Weekday",
          data: Object.values(productionByDay),
          backgroundColor: weekdayColors,
        },
      ],
    });
  }
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        // Skip data fetching if initial load isn't complete
        if (!initialLoadComplete) {
          // console.log("Skipping initial data load until View button is clicked");
          return;
        }
        
        // Make sure we have dates to query with
        if (!selectedStartDate || !selectedEndDate) {
          // console.warn("Start or end date is missing");
          return;
        }

        setIsLoading(true);

        // Prepare API URL with query parameters
        
        let apiUrl = "/api/kpi";
        const params = new URLSearchParams();
        
        // Apply 4-hour offset to start date for API call
        const apiStartDate = getApiDateWithOffset(selectedStartDate);
        params.append('startDate', apiStartDate.toISOString());
        params.append('endDate', selectedEndDate.toISOString());
        params.append('strictDateFilter', 'true');
        params.append('page', 'all');
        params.append('limit', 'none');
        
        if (selectedBatchName.length > 0) {
          selectedBatchName.forEach(batch => params.append('batch', batch));
        }
        
        if (selectedProduct.length > 0) {
          selectedProduct.forEach(product => params.append('product', product));
        }
        
        if (selectedMaterial.length > 0) {
          selectedMaterial.forEach(material => params.append('material', material));
        }
        
        apiUrl += '?' + params.toString();

        const response = await axios.get(apiUrl);
        let data = response.data;

        // Parse if string
        if (typeof data === "string") {
          try {
            data = JSON.parse(data.replace(/NaN/g, "null"));
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError.message);
            return;
          }
        }

        // If data is an object with nested array
        if (!Array.isArray(data)) {
          if (Array.isArray(data.result)) {
            data = data.result;
          } else if (Array.isArray(data.data)) {
            data = data.data;
          } else {
            console.error("Expected an array but got:", typeof data);
            return;
          }
        }

        // Final check
        if (!Array.isArray(data)) {
          console.error("Data is not an array after processing");
          return;
        }

        // Set unique values for dropdowns
        setBatchNames(
          Array.from(new Set(data.map((item) => item["Batch Name"] || "Unknown")))
        );
        setProductNames(
          Array.from(new Set(data.map((item) => item["Product Name"] || "Unknown")))
        );
        setMaterialNames(
          Array.from(new Set(data.map((item) => item["Material Name"] || "Unknown")))
        );

        calculateKPIsAndCharts(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Create debounced version of fetchGraphData
    const debouncedFetch = debounce(fetchGraphData, 500);

    // Call the debounced function
    debouncedFetch();

    // Cleanup
    return () => {
      debouncedFetch.cancel?.();
    };
  }, [
    selectedStartDate,
    selectedEndDate,
    selectedBatchName,
    selectedProduct,
    selectedMaterial,
    selectedCardBgColor,
    refreshFlag,
    initialLoadComplete
  ]);

  useEffect(() => {
    const selectedHex = getHexByName(selectedCardBgColor);
    const newGradient = getGradientColors(selectedHex, 12);
    setGradientColors(newGradient);
    setLineStrokeColor(newGradient[newGradient.length - 1]);
    setPointFillColor(newGradient[0]);
  }, [selectedCardBgColor]);

  const [handleButton, setHandleButton] = useState(false)

  // --- Chart Card Style Helper ---
  const chartCardSx = {
    height: 300,
    border: '1px solid #222',
    borderRadius: 2,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), border 0.2s, transform 0.25s cubic-bezier(.25,.8,.25,1)',
    '&:hover': {
      boxShadow: '0 0 24px 8px #bdbdbd, 0 16px 48px 0 rgba(33,33,33,0.18), 0 2px 8px rgba(0,0,0,0.12)',
      border: '2px solid #222',
      background: '#f5f5f5',
      transform: 'translateY(-6px) scale(1.04)',
    },
  };

  // --- KPI Card Style Helper ---
  const kpiCardSx = (selectedCardBgColor, getTextColorForBackground) => ({
    backgroundColor: getHexByName(selectedCardBgColor),
    color: getTextColorForBackground(selectedCardBgColor),
    textAlign: "center",
    height: "100px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    border: '1px solid #222',
    transition: "transform 0.3s ease-in-out, box-shadow 0.3s cubic-bezier(.25,.8,.25,1), border 0.2s",
    px: 2,
    '&:hover': {
      boxShadow: '0 0 24px 8px #bdbdbd, 0 16px 48px 0 rgba(33,33,33,0.18), 0 2px 8px rgba(0,0,0,0.12)',
      border: '2px solid #222',
      transform: 'translateY(-6px) scale(1.04)',
    },
  });

  // Custom plugin to scale up hovered bar
  const scaleBarOnHoverPlugin = {
    id: 'scaleBarOnHover',
    afterDatasetDraw(chart, args, pluginOptions) {
      const { ctx, tooltip } = chart;
      if (!tooltip?._active || !tooltip._active.length) return;

      const active = tooltip._active[0];
      if (active && active.element) {
        const bar = active.element;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 12;

        // Calculate new width and x position for scaling
        const scale = 1.5; // 1.5x wider
        const newWidth = bar.width * scale;
        const newX = bar.x - (newWidth - bar.width) / 2;

        ctx.fillStyle = bar.options.backgroundColor;
        ctx.strokeStyle = bar.options.borderColor || '#222';
        ctx.lineWidth = bar.options.borderWidth || 2;
        ctx.beginPath();
        ctx.moveTo(newX, bar.y);
        ctx.lineTo(newX + newWidth, bar.y);
        ctx.lineTo(newX + newWidth, bar.base);
        ctx.lineTo(newX, bar.base);
        ctx.closePath();
        ctx.fill();
        if (ctx.lineWidth > 0) ctx.stroke();

        ctx.restore();
      }
    }
  };

  // Custom plugin to scale up hovered bar vertically (blow up effect)
  const scaleBarUpOnHoverPlugin = {
    id: 'scaleBarUpOnHover',
    afterDatasetDraw(chart) {
      const { ctx, tooltip } = chart;
      if (!tooltip?._active || !tooltip._active.length) return;

      const active = tooltip._active[0];
      if (active && active.element) {
        const bar = active.element;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 12;

        // Calculate new height and y position for scaling up
        const scale = 1.12; // 1.12x taller (subtle effect)
        const originalHeight = bar.base - bar.y;
        const newHeight = originalHeight * scale;
        const newY = bar.base - newHeight;

        ctx.fillStyle = bar.options.backgroundColor;
        ctx.strokeStyle = bar.options.borderColor || '#222';
        ctx.lineWidth = bar.options.borderWidth || 2;
        ctx.beginPath();
        ctx.moveTo(bar.x - bar.width / 2, newY);
        ctx.lineTo(bar.x + bar.width / 2, newY);
        ctx.lineTo(bar.x + bar.width / 2, bar.base);
        ctx.lineTo(bar.x - bar.width / 2, bar.base);
        ctx.closePath();
        ctx.fill();
        if (ctx.lineWidth > 0) ctx.stroke();

        ctx.restore();
      }
    }
  };

  return (
    <div ref={dashboardRef}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ p: 3 }}>
          <div id="non-printable-area">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                mt:4
              }}
            >
              <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <Typography variant="h5" fontWeight="bold" sx={{ my: 1 }}>
                  KPI Dashboard
                </Typography>
                
                
              </Box>

              <FormControl
                size="small"
                sx={{
                  minWidth: 200,
                  borderRadius: "12px",
                  backgroundColor: "#f9f9f9",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  px: 1,
                  py: 0.5,
                }}
              >
                <InputLabel
                  sx={{
                    fontWeight: "bold",
                    color: "#555",
                    backgroundColor: "#f9f9f9",
                    px: 0.5,
                    borderRadius: 1,
                  }}
                >
                  Card Background
                </InputLabel>
                <Select
                  value={selectedCardBgColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setSelectedCardBgColor(newColor);
                    // Save the selected color theme to localStorage
                    localStorage.setItem('selectedCardBgColor', newColor);
                  }}
                  label="Card Background"
                  sx={{
                    borderRadius: "12px",
                    fontWeight: "medium",
                    backgroundColor: "#fff",
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                      },
                    },
                  }}
                >
                  {bgColorOptions.map((option) => (
                    <MenuItem key={option.hex} value={option.name}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          backgroundColor: option.hex,
                          display: "inline-block",
                          borderRadius: "50%",
                          marginRight: 1,
                          border: "1px solid #ccc",
                          boxShadow: "inset 0 0 2px rgba(0,0,0,0.2)",
                        }}
                      />
                      {option.name}
                    </MenuItem>
                  ))}
                                  </Select>
                </FormControl>
              </Box>
            </div>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <div id="non-printable-area-1">
              {/* Filters Row */}
              <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    width: "100%", // Full width
    gap: 2,
    px: 2,
    py: 2,
    backgroundColor: "#fff",
    borderRadius: 2,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
    justifyContent: "space-between",
    alignItems: "flex-end",
  }}
>

                {/* START DATE */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 160,
                    order: 1
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }} mb={1}>
                    Start Date
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <DateTimePicker
                      value={selectedStartDate}
                      onChange={handleStartDateChange}
                      format="MM/dd/yyyy HH:mm"
                      slotProps={{
                        textField: {
                          size: "small",
                          variant: "outlined",
                          sx: {
                            backgroundColor: "#f9f9f9",
                            borderRadius: 1,
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                            },
                          },
                        },
                      }}
                                          />
                    </FormControl>
                  </Box>

                  {/* END DATE */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 160,
                    order: 2
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }} mb={1}>
                    End Date
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <DateTimePicker
                      value={selectedEndDate}
                      onChange={handleEndDateChange}
                      format="MM/dd/yyyy HH:mm"
                      slotProps={{
                        textField: {
                          size: "small",
                          variant: "outlined",
                          sx: {
                            backgroundColor: "#f9f9f9",
                            borderRadius: 1,
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                            },
                          },
                        },
                      }}
                                          />
                    </FormControl>
                  </Box>

                  {/* PRODUCT */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 160,
                    order: 3
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }} mb={1}>
                    Product
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select Products</InputLabel>
                    <Select
                      multiple
                      value={selectedProduct}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        if (value.includes("all")) {
                          // Handle Select All / Deselect All
                          if (selectedProduct.length === productNames.length) {
                            setSelectedProduct([]);
                          } else {
                            setSelectedProduct([...productNames]);
                          }
                        } else {
                          // Handle multi-selection correctly
                          setSelectedProduct(value);
                        }
                      }}
                      renderValue={(selected) => {
                        if (
                          selected.length === 0 ||
                          selected.length === productNames.length
                        ) {
                          return "";
                        }
                        return selected.join(", ");
                      }}
                      displayEmpty
                      sx={{
                        backgroundColor: "#F8F9FA",
                        borderRadius: 1,
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        keepMounted: false,
                      }}
                    >
                      <MenuItem
                        value="all"
                        sx={{ fontWeight: 600 }}
                      >
                        {selectedProduct.length === productNames.length
                          ? "Deselect All"
                          : "Select All"}
                      </MenuItem>
                      {productNames.map((product) => (
                        <MenuItem
                          key={product}
                          value={product}
                          sx={{
                            fontWeight: selectedProduct.includes(product)
                              ? 600
                              : 400,
                            color: selectedProduct.includes(product)
                              ? "#000"
                              : "inherit",
                            paddingLeft: 2,
                          }}
                        >
                          {product}
                        </MenuItem>
                      ))}
                                          </Select>
                    </FormControl>
                  </Box>

                  {/* BATCH */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 160,
                    order: 4
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }} mb={1}>
                    Batch
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select Batch</InputLabel>
                    <Select
                      multiple
                      value={selectedBatchName}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        if (value.includes("Select All")) {
                          // Handle Select All / Deselect All
                          if (selectedBatchName.length === batchNames.length) {
                            setSelectedBatchName([]);
                          } else {
                            setSelectedBatchName([...batchNames]);
                          }
                        } else {
                          // Handle multi-selection correctly
                          setSelectedBatchName(value);
                        }
                      }}
                      renderValue={(selected) => {
                        if (selected.length === 0) return "";
                        if (selected.length === batchNames.length) return "";
                        return selected.join(", ");
                      }}
                      displayEmpty
                      sx={{
                        backgroundColor: "#F9F9F9",
                        borderRadius: 1,
                        width: "100%",
                        paddingY: 0.5,
                      }}
                    >
                      <MenuItem
                        value="Select All"
                        sx={{ fontWeight: 600 }}
                      >
                        {selectedBatchName.length === batchNames.length
                          ? "Deselect All"
                          : "Select All"}
                      </MenuItem>
                      {batchNames.map((batch) => (
                        <MenuItem
                          key={batch}
                          value={batch}
                          sx={{
                            fontWeight: selectedBatchName.includes(batch)
                              ? 600
                              : 400,
                            color: selectedBatchName.includes(batch)
                              ? "#000"
                              : "inherit",
                          }}
                        >
                          {batch}
                        </MenuItem>
                      ))}
                                          </Select>
                    </FormControl>
                  </Box>

                  {/* MATERIAL */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: "1 1 180px",
                    maxWidth: 200,
                    order: 5
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }} mb={1}>
                    Select Material:
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="select-material-label">
                      Select Material
                    </InputLabel>
                    <Select
                      labelId="select-material-label"
                      multiple
                      value={selectedMaterial}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: "#F8F9FA",
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="all" sx={{ fontWeight: 600 }}>
                        {selectedMaterial.length === materialNames.length
                          ? "Deselect All"
                          : "Select All"}
                      </MenuItem>
                      {materialNames.map((material) => (
                        <MenuItem
                          key={material}
                          value={material}
                          sx={{
                            fontWeight: selectedMaterial.includes(material)
                              ? 600
                              : 400,
                            color: selectedMaterial.includes(material)
                              ? "#000"
                              : "inherit",
                          }}
                        >
                          {material}
                        </MenuItem>
                      ))}
                                          </Select>
                    </FormControl>
                  </Box>

                  {/* VIEW BUTTON */}
                  {/* <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    minWidth: 120,
                    order: 6
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={applyFilters}
                    sx={{
                      textTransform: "none",
                      fontWeight: "bold",
                      borderRadius: "12px",
                      px: 3,
                      py: 1.5,
                      background: "linear-gradient(135deg, #4B5563, #9CA3AF)",
                      color: "#fff",
                      boxShadow:
                        "4px 4px 10px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(255, 255, 255, 0.1)",
                      transform: "translateY(-1px)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #374151, #6B7280)",
                        boxShadow:
                          "2px 2px 6px rgba(0, 0, 0, 0.3), inset -1px -1px 1px rgba(255, 255, 255, 0.05)",
                        transform: "translateY(1px)",
                      },
                    }}
                  >
                    View
                                      </Button>
                  </Box> */}
                </Box>
              </div>

            <Box sx={{ p: 0.5 }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sx={{ marginBottom: "3px" }}>
                  <Grid container spacing={2} wrap="nowrap">
                    {kpiData.map((item, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                          sx={kpiCardSx(selectedCardBgColor, getTextColorForBackground)}
                        >
                          <Box sx={{ mb: 0.5,mt:3 }}>
                            {index === 0 && (
                              <Diversity2OutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: getTextColorForBackground(selectedCardBgColor),
                                }}
                              />
                            )}
                            {index === 1 && (
                              <Brightness7OutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: getTextColorForBackground(selectedCardBgColor),
                                }}
                              />
                            )}
                            {index === 2 && (
                              <ArticleOutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: getTextColorForBackground(selectedCardBgColor),
                                }}
                              />
                            )}
                            {index === 3 && (
                              <CalendarMonthOutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: getTextColorForBackground(selectedCardBgColor),
                                }}
                              />
                            )}
                          </Box>
                          <CardContent sx={{ p: 0 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {item.value} {(() => {
                                if (index === 0) return 'batches';
                                if (index === 1) return 'materials';
                                if (index === 2) return 'products';
                                if (index === 3) return 'batches';
                                return '';
                              })()}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {item.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Row 1: 2 Charts */}
                <Grid container spacing={1} sx={{ mb: 1,mt:2 }}>
                  {/* <Grid item xs={12} md={6}> */}
                    {/* <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Recent Month</Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' ,mb:3}}>
                          {donutData ? (
                            <Doughnut data={donutData} plugins={[centerTextPlugin]} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { centerText: { text: `${donutData.datasets[0].data.reduce((a, b) => a + b, 0)} Orders` }, legend: { display: false }, tooltip: { callbacks: { label: (context) => { const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = ((context.parsed / total) * 100).toFixed(1); return `${context.label}: ${context.parsed} (${percentage}%)`; }, }, }, }, layout: { padding: 10 }, }} width={160} height={160} />
                          ) : (<CircularProgress />)}
                        </Box>
                      </CardContent>
                    </Card> */}
                  {/* </Grid> */}
                  {/* <Grid item xs={12} md={6}>
                    <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Quantity by Tons</Typography>
                        <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 2 }}>
                          {pieData ? (
                            <HighchartsReact
                              highcharts={Highcharts}
                              options={{
                                chart: {
                                  type: 'pie',
                                  options3d: {
                                    enabled: true,
                                    alpha: 30,
                                    beta: 0,
                                    depth: 30,
                                    viewDistance: 50,
                                  },
                                  backgroundColor: 'transparent',
                                  height: 240,
                                  spacing: [0, 0, 0, 0],
                                  style: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
                                },
                                title: { text: undefined },
                                credits: { enabled: false },
                                plotOptions: {
                                  pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    depth: 30,
                                    dataLabels: {
                                      enabled: true,
                                      format: '{point.percentage:.1f}%',
                                      style: {
                                        fontWeight: 'bold',
                                        color: '#222',
                                        fontSize: '15px',
                                        textOutline: 'none',
                                        textShadow: '0 1px 2px #fff',
                                      },
                                      distance: 18,
                                      filter: { property: 'percentage', operator: '>', value: 2 },
                                    },
                                    showInLegend: true,
                                    animation: { duration: 1200, easing: 'easeOutBounce' },
                                    states: {
                                      hover: {
                                        enabled: true,
                                        brightness: 0.1,
                                        halo: { size: 8 },
                                      },
                                    },
                                    slicedOffset: 12,
                                    borderColor: '#fff',
                                    borderWidth: 2,
                                  },
                                },
                                legend: {
                                  enabled: true,
                                  align: 'right',
                                  verticalAlign: 'middle',
                                  layout: 'vertical',
                                  symbolRadius: 6,
                                  symbolHeight: 14,
                                  symbolWidth: 14,
                                  itemStyle: {
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#222',
                                    fontFamily: 'Inter, Roboto, Arial, sans-serif',
                                    padding: '4px 0',
                                  },
                                  itemMarginBottom: 6,
                                  x: 10,
                                },
                                tooltip: {
                                  pointFormat: '<b>{point.y} Tons</b> ({point.percentage:.1f}%)',
                                  style: { fontSize: '14px', fontWeight: 'bold', color: '#222' },
                                  borderRadius: 8,
                                  backgroundColor: 'rgba(255,255,255,0.98)',
                                  borderColor: '#bbb',
                                  shadow: true,
                                },
                                series: [{
                                  name: 'Tons',
                                  colorByPoint: true,
                                  data: pieData.labels.map((label, idx) => ({
                                    name: label,
                                    y: pieData.datasets[0].data[idx],
                                    color: pieData.datasets[0].backgroundColor[idx],
                                    sliced: false,
                                    selected: false,
                                  })),
                                }],
                              }}
                            />
                          ) : (
                            <Typography>Loading pie chart...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid> */}
                </Grid>
              
                {/* Row 3: 2 Charts */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Historical Material Weight Dosed per Day</Typography>
                        <Box sx={{ flex: 1,mb:3 }}>
                          {historicalBarData ? (
                            <Bar
                              data={historicalBarData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    callbacks: {
                                      label: (context) => {
                                        const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                                        return `${context.dataset.label || ''}: ${Number(value).toFixed(2)} tons`;
                                      },
                                    },
                                  },
                                  scaleBarUpOnHover: {},
                                },
                                scales: {
                                  x: {
                                    type: 'category',
                                    ticks: {
                                      autoSkip: false,
                                      maxRotation: 45,
                                      minRotation: 0,
                                      callback: function(value, index, values) {
                                        return this.getLabelForValue(value);
                                      }
                                    },
                                  },
                                  y: {
                                    ticks: {
                                      callback: function(value) {
                                        return value + ' tons';
                                      }
                                    }
                                  }
                                },
                                hover: {
                                  mode: 'index',
                                  intersect: false,
                                  animationDuration: 200,
                                },
                                animation: {
                                  duration: 500,
                                  easing: 'easeOutQuart',
                                },
                              }}
                              plugins={[scaleBarUpOnHoverPlugin]}
                            />
                          ) : (
                            <Typography>Loading historical data...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Batch Quantity Timeline</Typography>
                        <Box sx={{ flex: 1 ,mb:3}}>
                          {lineData ? (
                            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return `${context.dataset.label || ''}: ${context.parsed.y !== undefined ? context.parsed.y : context.parsed} Tons`; }, }, }, }, elements: { line: { tension: 0.4, borderColor: lineData.datasets[0].borderColor, backgroundColor: hexToRgba(lineData.datasets[0].borderColor, 0.2) }, point: { radius: 4, hoverRadius: 6, backgroundColor: lineData.datasets[0].borderColor, borderColor: lineData.datasets[0].borderColor } }, scales: { x: { type: 'category', ticks: { autoSkip: false, maxRotation: 45, minRotation: 0, callback: function(value, index, values) { return this.getLabelForValue(value); } } }, }, }} />
                          ) : (
                            <Typography>Loading timeline data...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                {/* Row 4: 2 Charts */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>No. Batches by Weekday</Typography>
                        <Box sx={{ flex: 1, mb: 3 }}>
                          {barDataProduction ? (
                            <HighchartsReact
                              highcharts={Highcharts}
                              options={{
                                chart: {
                                  type: 'column',
                                  options3d: {
                                    enabled: true,
                                    alpha: 8,
                                    beta: 8,
                                    depth: 20,
                                    viewDistance: 30,
                                  },
                                  backgroundColor: 'transparent',
                                  height: 260,
                                  style: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
                                },
                                title: { text: undefined },
                                credits: { enabled: false },
                                xAxis: {
                                  categories: barDataProduction.labels,
                                  labels: {
                                    style: { fontWeight: 'bold', fontSize: '13px', color: '#222' },
                                  },
                                  lineColor: '#ccc',
                                  tickColor: '#ccc',
                                },
                                yAxis: {
                                  min: 0,
                                  title: { text: 'Batches', style: { fontWeight: 'bold', fontSize: '14px', color: '#222' } },
                                  labels: { style: { fontWeight: 'bold', fontSize: '13px', color: '#222' } },
                                  gridLineColor: '#eee',
                                },
                                legend: { enabled: false },
                                plotOptions: {
                                  column: {
                                    depth: 20,
                                    colorByPoint: true,
                                    colors: barDataProduction.datasets[0].backgroundColor,
                                    borderRadius: 10,
                                    groupZPadding: 0,
                                    pointPadding: 0,
                                    borderWidth: 0,
                                    dataLabels: {
                                      enabled: true,
                                      style: { fontWeight: 'bold', fontSize: '13px', color: '#222' },
                                      format: '{point.y}',
                                    },
                                    animation: { duration: 1000, easing: 'easeOutBounce' },
                                    states: {
                                      hover: {
                                        brightness: 0.18,
                                        enabled: true,
                                        halo: { size: 10 },
                                        shadow: true,
                                      },
                                    },
                                  },
                                },
                                tooltip: {
                                  pointFormat: '<b>{point.y} Batches</b>',
                                  style: { fontSize: '14px', fontWeight: 'bold', color: '#222' },
                                  borderRadius: 8,
                                  backgroundColor: 'rgba(255,255,255,0.98)',
                                  borderColor: '#bbb',
                                  shadow: true,
                                },
                                series: [{
                                  name: 'Batches',
                                  data: barDataProduction.datasets[0].data,
                                  colorByPoint: true,
                                  colors: barDataProduction.datasets[0].backgroundColor,
                                }],
                              }}
                            />
                          ) : (
                            <Typography>Loading data...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  {/* <Grid item xs={12} md={6}> */}
                    {/* <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Lot Tracking Over Time</Typography>
                        <Box sx={{ flex: 1,mb:3 }}>
                          {barDataLotTracking ? (
                            <Bar data={barDataLotTracking} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => { const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed; return `${context.dataset.label || ''}: ${Number(value).toFixed(2)} tons`; }, }, }, }, scales: { x: { type: 'category', ticks: { autoSkip: false, maxRotation: 45, minRotation: 0, callback: function(value, index, values) { return this.getLabelForValue(value); } } }, y: { ticks: { callback: function(value) { return value + ' Tons'; } } } }, }} />
                          ) : (
                            <Typography>Loading lot tracking data...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card> */}
                  {/* </Grid> */}
                  <Grid item xs={12} md={6}>
                    <Card sx={chartCardSx}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Quantity by Tons</Typography>
                        <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 2 }}>
                          {pieData ? (
                            <HighchartsReact
                              highcharts={Highcharts}
                              options={{
                                chart: {
                                  type: 'pie',
                                  options3d: {
                                    enabled: true,
                                    alpha: 30,
                                    beta: 0,
                                    depth: 30,
                                    viewDistance: 50,
                                  },
                                  backgroundColor: 'transparent',
                                  height: 240,
                                  spacing: [0, 0, 0, 0],
                                  style: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
                                },
                                title: { text: undefined },
                                credits: { enabled: false },
                                plotOptions: {
                                  pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    depth: 30,
                                    dataLabels: {
                                      enabled: true,
                                      format: '{point.percentage:.1f}%',
                                      style: {
                                        fontWeight: 'bold',
                                        color: '#222',
                                        fontSize: '15px',
                                        textOutline: 'none',
                                        textShadow: '0 1px 2px #fff',
                                      },
                                      distance: 18,
                                      filter: { property: 'percentage', operator: '>', value: 2 },
                                    },
                                    showInLegend: true,
                                    animation: { duration: 1200, easing: 'easeOutBounce' },
                                    states: {
                                      hover: {
                                        enabled: true,
                                        brightness: 0.1,
                                        halo: { size: 8 },
                                      },
                                    },
                                    slicedOffset: 12,
                                    borderColor: '#fff',
                                    borderWidth: 2,
                                  },
                                },
                                legend: {
                                  enabled: true,
                                  align: 'right',
                                  verticalAlign: 'middle',
                                  layout: 'vertical',
                                  symbolRadius: 6,
                                  symbolHeight: 14,
                                  symbolWidth: 14,
                                  itemStyle: {
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#222',
                                    fontFamily: 'Inter, Roboto, Arial, sans-serif',
                                    padding: '4px 0',
                                  },
                                  itemMarginBottom: 6,
                                  x: 10,
                                },
                                tooltip: {
                                  pointFormat: '<b>{point.y} Tons</b> ({point.percentage:.1f}%)',
                                  style: { fontSize: '14px', fontWeight: 'bold', color: '#222' },
                                  borderRadius: 8,
                                  backgroundColor: 'rgba(255,255,255,0.98)',
                                  borderColor: '#bbb',
                                  shadow: true,
                                },
                                series: [{
                                  name: 'Tons',
                                  colorByPoint: true,
                                  data: pieData.labels.map((label, idx) => ({
                                    name: label,
                                    y: pieData.datasets[0].data[idx],
                                    color: pieData.datasets[0].backgroundColor[idx],
                                    sliced: false,
                                    selected: false,
                                  })),
                                }],
                              }}
                            />
                          ) : (
                            <Typography>Loading pie chart...</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                {/* Row 5: Efficiency & Complexity (full width) */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={12}>
                    <Card sx={{ ...chartCardSx, height: 900 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>Efficiency & Complexity</Typography>
                        <Box sx={{ flex: 1 }}>
                          <EfficiencyAndComplexityCharts throughputData={throughputData} complexityData={complexityData} gradientColors={gradientColors} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </LocalizationProvider>
    </div>
  );
};

export default Dashboard;
