# Hercules - Smart Factory Management System (SFMS)

## Overview
Hercules SFMS is an industrial monitoring system designed for smart factories, integrating directly with PLCs for real-time data acquisition and analysis. Its core purpose is to provide production intelligence through a Dashboard, Historical Reports, and an Admin panel. The system focuses on generic industrial use cases, featuring real-time data visualization, customizable charts, and comprehensive system administration. It aims to enhance operational efficiency, provide critical insights into production processes, and support data-driven decision-making in manufacturing environments.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **Charts**: Chart.js
- **State Management**: TanStack Query
- **Routing**: Wouter

### Architecture Pattern
The application utilizes a monorepo structure, separating concerns into:
- **Client-side SPA**: React application with a modular, component-based architecture.
- **RESTful API**: Express server providing endpoints for facility data, metrics, and alerts.
- **Shared Schema**: Common TypeScript types and Drizzle schema definitions.
- **Database Layer**: PostgreSQL with Drizzle ORM for type-safe operations.

### UI/UX Decisions
The system features a sophisticated, cyberpunk-themed UI with industrial monitoring aesthetics, characterized by:
- Real-time data visualization with customizable charts.
- Responsive design following a mobile-first approach.
- Use of shadcn/ui and Radix UI for accessible and customizable components.
- Integrated `chart.js` for dynamic data presentation, including mini-charts for KPIs.
- Professional layout with emphasis on clear numerical values and accurate graphical representations.

### Technical Implementations
- **Simplified Architecture**: Removed complex PLC integration, focusing on core dashboard functionality with mock data for demonstration.
- **Data Flow**: Frontend communicates with the Express backend via HTTP requests. Zod schemas are used for data validation, and Drizzle ORM handles database interactions. TanStack Query manages data fetching, caching, and periodic refetching for real-time updates.
- **Database Schema**: Simplified to include only `production_metrics` table for basic production data storage with metric name, value, unit, and timestamp.
- **Navigation**: Comprehensive sidebar navigation with Dashboard, KPI Dashboard, Batch Calendar, Reports, and Admin sections.

### Feature Specifications
- **Dashboard**: Production intelligence dashboard with customizable charts and real-time metrics visualization.
- **KPI Dashboard**: Key Performance Indicators with filtering and analytics focused on production metrics.
- **Batch Calendar**: Daily production calendar with batch statistics and date filtering capabilities.
- **Reports**: Historical data analysis with multiple report types, filtering, and export functionality.
- **Admin Panel**: System administration including logo management, SMTP settings, and report scheduling.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver.
- **drizzle-orm**: Type-safe ORM for database interactions.
- **@tanstack/react-query**: For server state management and data fetching.
- **chart.js**: Used for data visualization and charting.
- **@radix-ui/***: Provides accessible UI component primitives.
- **wouter**: A lightweight client-side routing library.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: For type safety across the entire application stack.
- **Tailwind CSS**: A utility-first CSS framework for styling.

### UI Enhancement
- **class-variance-authority**: For creating type-safe CSS class variants.
- **clsx**: A utility for conditionally joining class names.
- **date-fns**: For date manipulation and formatting.
```