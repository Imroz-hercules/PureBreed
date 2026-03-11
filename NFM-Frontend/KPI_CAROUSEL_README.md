# KPI Carousel Feature

## Overview
The KPI Carousel is a new interactive chart visualization page that displays all the key performance indicators from the KPI Dashboard in a carousel format. This provides a focused, full-screen view of each chart with smooth navigation between different visualizations.

## Features

### 🎠 Carousel Functionality
- **Smooth Transitions**: 0.3-0.5s ease transitions between charts
- **Auto-play**: Automatic slide progression with 5-second intervals
- **Manual Navigation**: Previous/Next arrow buttons and pagination dots
- **Play/Pause Control**: Toggle auto-play functionality
- **Chart Counter**: Shows current position (e.g., "2 / 4")

### 📊 Chart Types Included
1. **Material Weight per Day** - Bar chart showing daily material consumption
2. **Products by Count** - Pie chart displaying product distribution
3. **No. Batches by Weekday** - Bar chart showing weekly production patterns
4. **Material Error Analysis** - Pie chart highlighting materials with >5% error

### 🎨 Design Features
- **Dark Navy Theme**: Consistent with existing application (#0a0e27 background)
- **Cyan Accents**: #00d4ff color scheme for UI elements
- **Full-height Charts**: Maximum data visibility with 600px chart containers
- **Responsive Design**: Works on different screen sizes
- **Loading States**: Smooth loading overlays during data fetching

### 🔧 Technical Implementation
- **Embla Carousel**: Uses `embla-carousel-react` for smooth carousel functionality
- **Autoplay Plugin**: Automatic slide progression with pause/play controls
- **Data Integration**: Reuses exact same data fetching logic as KPI Dashboard
- **Filter Support**: All filters (date range, product, batch, material) apply to carousel charts
- **Historical Data**: Production data analysis with filtering capabilities

## Usage

### Navigation
1. Access via sidebar menu: "KPI Carousel"
2. URL: `/kpi-carousel`
3. Use arrow buttons or dots to navigate between charts
4. Toggle auto-play with the play/pause button

### Filtering
- Apply the same filters as the KPI Dashboard
- Charts update automatically when filters change
- Date range, product, batch, and material filters are supported

### Controls
- **← →**: Previous/Next navigation arrows
- **⏯️**: Play/Pause auto-play toggle
- **Dots**: Direct navigation to specific charts (4 total)
- **Counter**: Shows current chart position (1-4)

## File Structure
```
NFM-Frontend/client/src/
├── pages/hercules-sfms/
│   └── KPICarousel.tsx          # Main carousel component
├── components/hercules-sfms/
│   ├── ChartComponent.tsx       # Reused chart components
│   └── WaterSystemLayout.tsx    # Updated with new page title
├── App.tsx                      # Updated with new route
└── index.css                    # Added Embla carousel styles
```

## Dependencies
- `embla-carousel-react`: Carousel functionality
- `embla-carousel-autoplay`: Auto-play plugin
- Existing chart components and data fetching logic

## Integration Notes
- **No Modifications**: Existing KPI Dashboard remains completely unchanged
- **Data Reuse**: Uses identical API calls and data processing logic
- **Component Reuse**: Leverages existing ChartComponent for consistency
- **Theme Consistency**: Matches existing dark navy theme with cyan accents

## Future Enhancements
- Chart-specific controls (zoom, pan, etc.)
- Export functionality for individual charts
- Customizable chart order
- Full-screen mode toggle
- Chart comparison mode
- Touch/swipe support for mobile devices
