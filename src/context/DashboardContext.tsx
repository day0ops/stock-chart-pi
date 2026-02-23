import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { DashboardConfig, DashboardState, DashboardAction, ChartConfig, LayoutConfig } from '../types';
import defaultConfig from '../config/dashboard.json';

const STORAGE_KEY = 'dashboard-config';

// Load config from localStorage or use default
function loadConfig(): DashboardConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultConfig, ...parsed } as DashboardConfig;
    }
  } catch (e) {
    console.error('Failed to load config from localStorage:', e);
  }
  return defaultConfig as DashboardConfig;
}

// Save config to localStorage
function saveConfig(config: DashboardConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage:', e);
  }
}

// Generate unique ID for charts
function generateId(): string {
  return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initial state
const initialState: DashboardState = {
  config: loadConfig(),
  chartData: {},
  isConfigOpen: false,
};

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_CONFIG': {
      saveConfig(action.payload);
      return { ...state, config: action.payload };
    }

    case 'UPDATE_LAYOUT': {
      const newConfig = { ...state.config, layout: action.payload };
      saveConfig(newConfig);
      return { ...state, config: newConfig };
    }

    case 'ADD_CHART': {
      const newChart = { ...action.payload, id: action.payload.id || generateId() };
      const newCharts = [...state.config.charts, newChart];
      const newConfig = { ...state.config, charts: newCharts };
      saveConfig(newConfig);
      return { ...state, config: newConfig };
    }

    case 'REMOVE_CHART': {
      const newCharts = state.config.charts.filter((c) => c.id !== action.payload);
      const newConfig = { ...state.config, charts: newCharts };
      const newChartData = { ...state.chartData };
      delete newChartData[action.payload];
      saveConfig(newConfig);
      return { ...state, config: newConfig, chartData: newChartData };
    }

    case 'UPDATE_CHART': {
      const newCharts = state.config.charts.map((c) =>
        c.id === action.payload.id ? action.payload : c
      );
      const newConfig = { ...state.config, charts: newCharts };
      saveConfig(newConfig);
      return { ...state, config: newConfig };
    }

    case 'SET_CHART_DATA': {
      return {
        ...state,
        chartData: {
          ...state.chartData,
          [action.payload.id]: {
            ...state.chartData[action.payload.id],
            ...action.payload.data,
          },
        },
      };
    }

    case 'TOGGLE_CONFIG': {
      return { ...state, isConfigOpen: !state.isConfigOpen };
    }

    case 'SET_FINNHUB_KEY': {
      const newConfig = { ...state.config, finnhubApiKey: action.payload };
      saveConfig(newConfig);
      return { ...state, config: newConfig };
    }

    default:
      return state;
  }
}

// Context
interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  // Helper functions
  addChart: (chart: Omit<ChartConfig, 'id'>) => void;
  removeChart: (id: string) => void;
  updateChart: (chart: ChartConfig) => void;
  updateLayout: (layout: LayoutConfig) => void;
  setFinnhubKey: (key: string) => void;
  toggleConfig: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

// Provider
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Helper functions
  const addChart = (chart: Omit<ChartConfig, 'id'>) => {
    dispatch({ type: 'ADD_CHART', payload: { ...chart, id: generateId() } });
  };

  const removeChart = (id: string) => {
    dispatch({ type: 'REMOVE_CHART', payload: id });
  };

  const updateChart = (chart: ChartConfig) => {
    dispatch({ type: 'UPDATE_CHART', payload: chart });
  };

  const updateLayout = (layout: LayoutConfig) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  };

  const setFinnhubKey = (key: string) => {
    dispatch({ type: 'SET_FINNHUB_KEY', payload: key });
  };

  const toggleConfig = () => {
    dispatch({ type: 'TOGGLE_CONFIG' });
  };

  return (
    <DashboardContext.Provider
      value={{
        state,
        dispatch,
        addChart,
        removeChart,
        updateChart,
        updateLayout,
        setFinnhubKey,
        toggleConfig,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

// Hook
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
