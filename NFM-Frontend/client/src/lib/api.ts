// API Configuration
// This file centralizes all API endpoints to make it easy to change the backend URL

// Get the current hostname and port from the browser
const getApiBaseUrl = () => {
  // Always use the same hostname as the frontend but with port 5002
  // This works for both localhost and remote access
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const apiUrl = `${protocol}//${hostname}:5002`;
  
  
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // KPI and Reports
  KPI: `${API_BASE_URL}/api/kpi`,
  REPORTS: `${API_BASE_URL}/api/reports`,
  FILTER_OPTIONS: `${API_BASE_URL}/api/filter-options`,
  KPI_CALENDAR: `${API_BASE_URL}/api/kpi_calendar`,
  KPI_CALENDAR_DETAILS: `${API_BASE_URL}/api/kpi_calendar/details`,
  
  // Live Data
  DB4_LIVE: `${API_BASE_URL}/api/db4/live/read`,
  DB3_LIVE: `${API_BASE_URL}/api/db3/live/read`,
  
  // PLC Data
  PLC_DATA: `${API_BASE_URL}/api/plc_data`,
  DB3_DATA: `${API_BASE_URL}/api/db3_data`,
  
  // Streaming Control
  START_DB4_STREAM: `${API_BASE_URL}/api/start_live_stream`,
  STOP_DB4_STREAM: `${API_BASE_URL}/api/stop_live_stream`,
  START_DB3_STREAM: `${API_BASE_URL}/api/start_db3_stream`,
  STOP_DB3_STREAM: `${API_BASE_URL}/api/stop_db3_stream`,
  STREAM_STATUS: `${API_BASE_URL}/api/stream_status`,
};

// Helper function to get API URL with query parameters
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number | boolean>) => {
  if (!params) return endpoint;
  
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
};

// SMTP Profile interface
export interface SMTPProfile {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
}

// API Service class for admin functions
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // SMTP Profile methods
  async getSMTPProfiles(): Promise<SMTPProfile[]> {
    const response = await fetch(`${this.baseUrl}/api/smtp/profiles`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async addSMTPProfile(profile: SMTPProfile): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/smtp/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async activateSMTPProfile(name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/smtp/profiles/${name}/activate`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async saveSMTPSettings(settings: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/smtp/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async uploadLogo(logo: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', logo);
    
    const response = await fetch(`${this.baseUrl}/api/upload/logo`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.logoUrl;
  }

  async sendTestEmail(recipients: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/smtp/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async getCSVFormatReport(filters: any): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const response = await fetch(`${this.baseUrl}/api/kpi/csv-format-report?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

// Create and export a default instance
export const apiService = new ApiService();

// Export the base URL for backward compatibility
export default API_BASE_URL;