/**
 * AETHER — Weather & Climate Analytics Platform
 * Production Client Application
 */

(function () {
  'use strict';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const State = {
    location: {
      name: 'London',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
      elevation: 35
    },
    units: 'metric', // 'metric' (°C, km/h, mm, hPa) or 'imperial' (°F, mph, in, inHg)
    activeView: 'overview',
    chartLayer: 'temp', // 'temp' | 'precip' | 'wind'
    weatherData: null,
    airQualityData: null,
    recentlyViewed: [],
    clockInterval: null,
    refreshInterval: null,
    map: null,
    mapMarker: null,
    mapCardData: null,
    comparisonData: null,
    comparisonUnits: null,
    comparisonLoadedAt: 0,
    theme: 'dark',
    accent: 'emerald',
    density: 'comfortable'
  };

  // Curated global stations for the City Comparisons view
  const ComparisonCities = [
    { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
    { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
    { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
    { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
    { name: 'Reykjavik', country: 'Iceland', latitude: 64.1466, longitude: -21.9426 },
    { name: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333 },
    { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 }
  ];

  // Weather code to human readable description + SVG icon
  const WeatherCodeMap = {
    0: { label: 'Clear Sky', icon: 'sun' },
    1: { label: 'Mainly Clear', icon: 'sun' },
    2: { label: 'Partly Cloudy', icon: 'partly-cloudy' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Foggy', icon: 'fog' },
    48: { label: 'Depositing Rime Fog', icon: 'fog' },
    51: { label: 'Light Drizzle', icon: 'drizzle' },
    53: { label: 'Moderate Drizzle', icon: 'drizzle' },
    55: { label: 'Dense Drizzle', icon: 'drizzle' },
    61: { label: 'Slight Rain', icon: 'rain' },
    63: { label: 'Moderate Rain', icon: 'rain' },
    65: { label: 'Heavy Rain', icon: 'rain' },
    71: { label: 'Slight Snowfall', icon: 'snow' },
    73: { label: 'Moderate Snowfall', icon: 'snow' },
    75: { label: 'Heavy Snowfall', icon: 'snow' },
    77: { label: 'Snow Grains', icon: 'snow' },
    80: { label: 'Slight Rain Showers', icon: 'rain' },
    81: { label: 'Moderate Showers', icon: 'rain' },
    82: { label: 'Violent Showers', icon: 'rain' },
    85: { label: 'Slight Snow Showers', icon: 'snow' },
    86: { label: 'Heavy Snow Showers', icon: 'snow' },
    95: { label: 'Thunderstorm', icon: 'storm' },
    96: { label: 'Thunderstorm w/ Hail', icon: 'storm' },
    99: { label: 'Heavy Thunderstorm w/ Hail', icon: 'storm' }
  };

  // SVG Weather Icons Generator
  function getWeatherIconSvg(iconName, isDay = 1) {
    switch (iconName) {
      case 'sun':
        if (!isDay) {
          return `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
      case 'partly-cloudy':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.5 10a4 4 0 0 0-4-4 4 4 0 0 0-3.9 3.1A5.5 5.5 0 0 0 8 20h9a5 5 0 0 0 1.5-9.8 4 4 0 0 0-3-.2Z"/></svg>`;
      case 'cloud':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
      case 'drizzle':
      case 'rain':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 19-2 3"/><path d="m12 19-2 3"/><path d="m16 19-2 3"/></svg>`;
      case 'snow':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#a5f3fc" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="8" y1="20" x2="8.01" y2="20"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="16" y1="20" x2="16.01" y2="20"/></svg>`;
      case 'storm':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 15-3 5h4l-2 5"/></svg>`;
      case 'fog':
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M4 14h16"/><path d="M4 18h16"/><path d="M4 10h16"/></svg>`;
    }
  }

  // Thermal comfort classification (heat index / wind chill) in display units
  function thermalComfortLabel(temp, humidity, windSpeed) {
    if (temp == null || isNaN(temp)) return 'Comfortable';
    if (State.units === 'imperial') {
      if (temp >= 80 && humidity > 40) {
        const hi = -42.379 + 2.04901523 * temp + 10.14333127 * humidity - 0.22475541 * temp * humidity - 0.00683783 * temp * temp - 0.05481717 * humidity * humidity + 0.00122874 * temp * temp * humidity + 0.00085282 * temp * humidity * humidity - 0.00000199 * temp * temp * humidity * humidity;
        return hi > temp ? `Heat Index ${Math.round(hi)}°` : 'Comfortable';
      }
      if (temp <= 50 && windSpeed >= 3) {
        const wc = 35.74 + 0.6215 * temp - 35.75 * Math.pow(windSpeed, 0.16) + 0.4275 * temp * Math.pow(windSpeed, 0.16);
        return `Wind Chill ${Math.round(wc)}°`;
      }
      return 'Comfortable';
    }
    // Metric (°C, km/h)
    if (temp >= 27 && humidity > 40) {
      const hi = -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity - 0.14611605 * temp * humidity - 0.012308094 * temp * temp - 0.0164248277778 * humidity * humidity + 0.002211732 * temp * temp * humidity + 0.00072546 * temp * humidity * humidity - 0.000003582 * temp * temp * humidity * humidity;
      return hi > temp ? `Heat Index ${Math.round(hi)}°` : 'Comfortable';
    }
    if (temp <= 10 && windSpeed >= 4.8) {
      const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
      return `Wind Chill ${Math.round(wc)}°`;
    }
    return 'Comfortable';
  }

  // Toast Notification helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    const toastAccent = type === 'error' ? '#f43f5e' : cssVar('--accent-primary', '#10b981');
    toast.innerHTML = `
      <svg style="width:16px;height:16px;color:${toastAccent};flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : '<path d="M20 6 9 17l-5-5"/>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================
  // APPEARANCE & THEMING SYSTEM
  // ==========================================
  const AccentThemes = {
    emerald: { primary: '#10b981', secondary: '#059669', light: '#34d399', rgb: '16, 185, 129' },
    blue:    { primary: '#0ea5e9', secondary: '#0284c7', light: '#38bdf8', rgb: '14, 165, 233' },
    violet:  { primary: '#8b5cf6', secondary: '#7c3aed', light: '#a78bfa', rgb: '139, 92, 246' },
    amber:   { primary: '#f59e0b', secondary: '#d97706', light: '#fbbf24', rgb: '245, 158, 11' },
    rose:    { primary: '#f43f5e', secondary: '#e11d48', light: '#fb7185', rgb: '244, 63, 94' },
    prismatic: { primary: '#f43f5e', secondary: '#e11d48', light: '#fb7185', rgb: '244, 63, 94', prismatic: true }
  };

  // Per-card accent palette used when the "Prismatic" theme is active.
  // Each major card / widget gets its own distinct color so the dashboard
  // reads as a multi-hued rainbow while keeping the same design language.
  const PrismaticColors = [
    { primary: '#f43f5e', secondary: '#e11d48', light: '#fb7185', rgb: '244, 63, 94' },   // rose
    { primary: '#f59e0b', secondary: '#d97706', light: '#fbbf24', rgb: '245, 158, 11' },  // amber
    { primary: '#10b981', secondary: '#059669', light: '#34d399', rgb: '16, 185, 129' },  // emerald
    { primary: '#0ea5e9', secondary: '#0284c7', light: '#38bdf8', rgb: '14, 165, 233' },  // sky
    { primary: '#8b5cf6', secondary: '#7c3aed', light: '#a78bfa', rgb: '139, 92, 246' },  // violet
    { primary: '#ec4899', secondary: '#db2777', light: '#f472b6', rgb: '236, 72, 153' },  // pink
    { primary: '#14b8a6', secondary: '#0d9488', light: '#5eead4', rgb: '20, 184, 166' },  // teal
    { primary: '#eab308', secondary: '#ca8a04', light: '#fde047', rgb: '234, 179, 8' }    // gold
  ];

  // Resolve the accent color for a given card index, honoring prismatic mode.
  function accentFor(index) {
    const accent = AccentThemes[State.accent] || AccentThemes.emerald;
    if (accent.prismatic && typeof index === 'number') {
      return PrismaticColors[index % PrismaticColors.length];
    }
    return accent;
  }

  // Palette definitions for dark & light modes. Each theme keeps the exact same
  // design language (spacing, radius, elevation) and only swaps the colors.
  const ThemePalettes = {
    dark: {
      '--bg-deep': '#07090e', '--bg-surface': '#0c0f17', '--bg-card': '#111522',
      '--bg-card-hover': '#151b2c', '--bg-input': '#151a28', '--bg-pill': '#171d2e',
      '--text-pure': '#ffffff', '--text-main': '#f1f5f9', '--text-muted': '#94a3b8',
      '--text-dim': '#64748b', '--text-dark': '#475569',
      '--border-subtle': 'rgba(255, 255, 255, 0.06)', '--border-default': 'rgba(255, 255, 255, 0.09)',
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
      '--shadow-md': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 16px -4px var(--accent-glow-subtle)',
      '--shadow-lg': '0 12px 36px -4px rgba(0, 0, 0, 0.7), 0 0 24px -6px var(--accent-glow)',
      '--ambient-1': 'rgba(16, 185, 129, 0.06)', '--ambient-2': 'rgba(15, 23, 42, 0.8)',
      '--chart-grid': 'rgba(255, 255, 255, 0.06)', '--chart-axis': '#64748b', '--chart-surface': 'transparent',
      '--track-fill': 'rgba(255, 255, 255, 0.05)', '--divider': 'rgba(255, 255, 255, 0.04)',
      '--map-bg': '#080a10', '--map-panel': '#ffffff'
    },
    light: {
      '--bg-deep': '#f1f5f9', '--bg-surface': '#ffffff', '--bg-card': '#ffffff',
      '--bg-card-hover': '#f8fafc', '--bg-input': '#f1f5f9', '--bg-pill': '#f8fafc',
      '--text-pure': '#020617', '--text-main': '#0f172a', '--text-muted': '#475569',
      '--text-dim': '#94a3b8', '--text-dark': '#cbd5e1',
      '--border-subtle': 'rgba(15, 23, 42, 0.06)', '--border-default': 'rgba(15, 23, 42, 0.09)',
      '--shadow-sm': '0 1px 3px rgba(15, 23, 42, 0.08)',
      '--shadow-md': '0 4px 20px -2px rgba(15, 23, 42, 0.10), 0 0 16px -4px var(--accent-glow-subtle)',
      '--shadow-lg': '0 12px 36px -4px rgba(15, 23, 42, 0.16), 0 0 24px -6px var(--accent-glow)',
      '--ambient-1': 'rgba(16, 185, 129, 0.09)', '--ambient-2': 'rgba(241, 245, 249, 0.9)',
      '--chart-grid': 'rgba(15, 23, 42, 0.08)', '--chart-axis': '#64748b', '--chart-surface': 'transparent',
      '--track-fill': 'rgba(15, 23, 42, 0.08)', '--divider': 'rgba(15, 23, 42, 0.05)',
      '--map-bg': '#eef2f6', '--map-panel': '#0f172a'
    }
  };

  const densityConfig = {
    compact:     { '--card-gap': '14px', '--card-pad': '16px', '--app-pad': '16px' },
    comfortable: { '--card-gap': '20px', '--card-pad': '20px', '--app-pad': '20px' },
    spacious:    { '--card-gap': '26px', '--card-pad': '26px', '--app-pad': '24px' }
  };

  // Read a CSS custom property value from the document root
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v && v.trim() ? v.trim() : fallback;
  }

  // Build an rgba() color from a hex accent + alpha, using the active accent theme
  function accentRgba(alpha) {
    const rgb = cssVar('--accent-rgb', '16, 185, 129');
    return `rgba(${rgb}, ${alpha})`;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '16, 185, 129';
  }

  function applyAppearance() {
    const root = document.documentElement;
    const palette = ThemePalettes[State.theme] || ThemePalettes.dark;
    const accent = AccentThemes[State.accent] || AccentThemes.emerald;
    const dens = densityConfig[State.density] || densityConfig.comfortable;

    // Theme colors
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));

    // Accent colors
    root.style.setProperty('--accent-primary', accent.primary);
    root.style.setProperty('--accent-secondary', accent.secondary);
    root.style.setProperty('--accent-light', accent.light);
    root.style.setProperty('--accent-glow', `rgba(${accent.rgb}, 0.18)`);
    root.style.setProperty('--accent-glow-subtle', `rgba(${accent.rgb}, 0.08)`);
    root.style.setProperty('--accent-border', `rgba(${accent.rgb}, 0.3)`);
    root.style.setProperty('--accent-rgb', accent.rgb);

    // Density
    Object.entries(dens).forEach(([k, v]) => root.style.setProperty(k, v));

    // Theme class (drives map tile style selection)
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${State.theme}`);

    // Prismatic mode adds a class that lets each card take its own accent
    root.classList.toggle('theme-prismatic', !!accent.prismatic);

    // Keep the browser chrome / status bar in sync with the active theme
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', State.theme === 'light' ? '#f1f5f9' : '#07090e');
    }

    // Sync UI controls
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === State.theme);
    });
    document.querySelectorAll('.accent-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.accent === State.accent);
    });
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.density === State.density);
    });

    // Persist to localStorage immediately (fast, synchronous)
    try {
      const existing = JSON.parse(localStorage.getItem('aether_storage') || '{}');
      localStorage.setItem('aether_storage', JSON.stringify({
        ...existing,
        theme: State.theme,
        accent: State.accent,
        density: State.density
      }));
    } catch (_) {}

    // Redraw any visible canvases so grid/label colors match the new theme
    if (State.weatherData?.hourly) {
      renderHourlyChart(State.weatherData.hourly);
      renderMultiMetricChart(State.weatherData.hourly);
      renderWindRose(State.weatherData.hourly);
      renderPrecipBars(State.weatherData.hourly);
      renderPressureTrend(State.weatherData.hourly);
    }
    if (State.airQualityData) {
      renderAqiTrend(State.airQualityData);
    }
    if (State.comparisonData) {
      renderComparison(State.comparisonData);
    }
    if (State.map) {
      State.map.resize();
      if (typeof State.mapThemeWatcher === 'function') {
        State.mapThemeWatcher();
      }
    }
  }

  // ==========================================
  // STORAGE MANAGER (data.json & localStorage)
  // ==========================================
  const StorageManager = {
    async loadPreferences() {
      // 1. Try local data.json endpoint (backend mode only)
      try {
        const data = await fetchInternalJson('/api/data-json');
        if (data) {
          if (data.preferences) {
            const p = data.preferences;
            State.units = p.unit || 'metric';
            State.activeView = p.activeView || 'overview';
            if (p.theme) State.theme = p.theme;
            if (p.accent) State.accent = p.accent;
            if (p.density) State.density = p.density;
          }
          if (data.lastSelectedLocation) {
            State.location = data.lastSelectedLocation;
          }
          if (Array.isArray(data.recentlyViewedLocations)) {
            State.recentlyViewed = data.recentlyViewedLocations;
          }
          this.updateUiWithPreferences();
          return;
        }
      } catch (err) {
        console.warn('Could not read data.json from backend; checking localStorage...', err.message);
      }

      // 2. Fallback to localStorage
      try {
        const local = localStorage.getItem('aether_storage');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.units) State.units = parsed.units;
          if (parsed.location) State.location = parsed.location;
          if (parsed.activeView) State.activeView = parsed.activeView;
          if (parsed.theme) State.theme = parsed.theme;
          if (parsed.accent) State.accent = parsed.accent;
          if (parsed.density) State.density = parsed.density;
        }
      } catch (_) {}

      this.updateUiWithPreferences();
    },

    updateUiWithPreferences() {
      // Set active unit button
      document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === State.units);
      });
      // Apply appearance before revealing views to avoid a flash of wrong theme
      applyAppearance();
      // Set active view tab (desktop tabs + mobile bottom nav)
      document.querySelectorAll('.view-tab, .bottom-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === State.activeView);
      });
      document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${State.activeView}`);
      });
    },

    async save() {
      const payload = {
        lastSelectedLocation: State.location,
        recentlyViewedLocations: State.recentlyViewed.slice(0, 10),
        preferences: {
          unit: State.units,
          autoRefresh: true,
          refreshIntervalSec: 300,
          activeView: State.activeView
        }
      };

      // Save locally
      try {
        localStorage.setItem('aether_storage', JSON.stringify(payload));
      } catch (_) {}

      // Save to data.json via backend endpoint (backend mode only)
      if (!StaticMode.enabled) {
        try {
          await fetch('/api/data-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.warn('Backend sync for data.json failed:', err.message);
        }
      }
    }
  };

  // ==========================================
  // REAL-TIME API CLIENT
  // ==========================================
  // Detect whether we're running without a backend (static hosting).
  // When true, skip all /api/* proxy attempts and go straight to public APIs.
  const StaticMode = {
    enabled: false,
    async detect() {
      // If the page was served from the file:// protocol, we are definitely static.
      if (location.protocol === 'file:') {
        this.enabled = true;
        return this.enabled;
      }
      // Probe the health endpoint. On static hosts (GitHub Pages / Netlify) this
      // either 404s or returns the SPA index.html. We treat a non-JSON response
      // as "no backend" so the app goes fully client-side.
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!res.ok) { this.enabled = true; return this.enabled; }
        const text = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (_) { parsed = null; }
        this.enabled = !(parsed && parsed.ok === true);
      } catch (_) {
        this.enabled = true;
      }
      return this.enabled;
    }
  };

  // A /api/* fetch is only trusted as JSON when the backend is present.
  // Paths are resolved relative to the current page so the app also works
  // when hosted in a GitHub Pages project subdirectory (e.g. /repo-name/).
  function resolvePath(url) {
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
    const base = location.href.includes('index.html')
      ? location.href.replace(/index\.html.*$/, '')
      : location.href.replace(/[^/]*$/, '');
    return new URL(url, base).href;
  }

  async function fetchInternalJson(url, options) {
    if (StaticMode.enabled) return null;
    try {
      const res = await fetch(resolvePath(url), options);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  const ApiClient = {
    async fetchWeather(lat, lon, units) {
      // First try internal Express proxy (skipped in static mode)
      try {
        const url = `/api/weather?lat=${lat}&lon=${lon}&units=${units}`;
        const data = await fetchInternalJson(url);
        if (data) {
          return data;
        }
      } catch (err) {
        console.warn('Express proxy weather fetch failed, attempting direct Open-Meteo fallback:', err.message);
      }

      // Direct fallback to Open-Meteo
      const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
      const windUnit = units === 'imperial' ? 'mph' : 'kmh';
      const precipUnit = units === 'imperial' ? 'inch' : 'mm';
      const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
        `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max` +
        `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto&forecast_days=14`;

      const response = await fetch(directUrl);
      if (!response.ok) throw new Error('Direct Weather API request failed');
      return await response.json();
    },

    async fetchAirQuality(lat, lon) {
      // First try internal Express proxy (skipped in static mode)
      try {
        const url = `/api/air-quality?lat=${lat}&lon=${lon}`;
        const data = await fetchInternalJson(url);
        if (data) {
          return data;
        }
      } catch (err) {
        console.warn('Express proxy air quality fetch failed, attempting direct Open-Meteo fallback:', err.message);
      }

      // Direct fallback to Open-Meteo Air Quality
      const directUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
        `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index` +
        `&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi` +
        `&timezone=auto&forecast_days=3`;

      const response = await fetch(directUrl);
      if (!response.ok) throw new Error('Direct Air Quality API request failed');
      return await response.json();
    },

    async searchLocations(query) {
      try {
        const data = await fetchInternalJson(`/api/search?q=${encodeURIComponent(query)}`);
        if (data && Array.isArray(data.results)) {
          return data.results;
        }
      } catch (_) {}

      // Direct fallback
      try {
        const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
        const res = await fetch(directUrl);
        const data = await res.json();
        return data.results || [];
      } catch (err) {
        return [];
      }
    },

    async reverseGeocode(lat, lon) {
      try {
        const data = await fetchInternalJson(`/api/reverse?lat=${lat}&lon=${lon}`);
        if (data) {
          return data;
        }
      } catch (_) {}

      return {
        name: `Coordinate (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        country: 'Global Coordinate',
        latitude: lat,
        longitude: lon
      };
    }
  };

  // ==========================================
  // UI RENDERERS
  // ==========================================

  // Real-Time Local Clock
  function startLocalClock(timezone) {
    if (State.clockInterval) clearInterval(State.clockInterval);

    function tick() {
      const clockEl = document.getElementById('heroClockText');
      if (!clockEl) return;
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        clockEl.textContent = formatter.format(now);
      } catch (_) {
        clockEl.textContent = new Date().toLocaleTimeString();
      }
    }

    tick();
    State.clockInterval = setInterval(tick, 1000);
  }

  // Update Hero & Header UI
  function renderHero(weather, airQuality) {
    const cur = weather.current || {};
    const daily = weather.daily || {};
    const u = State.units === 'imperial' ? '°F' : '°C';

    document.getElementById('heroCityName').textContent = State.location.name;
    document.getElementById('heroCountryName').textContent = State.location.country || 'Global';
    document.getElementById('heroCoordsText').textContent = `${Math.abs(State.location.latitude).toFixed(2)}° ${State.location.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(State.location.longitude).toFixed(2)}° ${State.location.longitude >= 0 ? 'E' : 'W'}`;
    document.getElementById('heroElevationVal').textContent = `${Math.round(weather.elevation || State.location.elevation || 20)}m`;

    // Temperature & Weather code
    const tempVal = Math.round(cur.temperature_2m ?? 0);
    const code = cur.weather_code ?? 0;
    const isDay = cur.is_day ?? 1;
    const meta = WeatherCodeMap[code] || { label: 'Clear', icon: 'sun' };

    document.getElementById('heroCurrentTemp').textContent = tempVal;
    document.getElementById('heroTempUnit').textContent = u;
    document.getElementById('heroConditionText').textContent = meta.label;
    document.getElementById('heroWeatherIcon').innerHTML = getWeatherIconSvg(meta.icon, isDay);

    const appTemp = Math.round(cur.apparent_temperature ?? tempVal);
    document.getElementById('heroApparentTemp').textContent = `${appTemp}${u}`;

    // Thermal comfort indicator
    const comfortLabel = thermalComfortLabel(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m);
    const comfortEl = document.getElementById('heroComfortText');
    if (comfortEl) comfortEl.textContent = comfortLabel;

    const todayHigh = Math.round(daily.temperature_2m_max ? daily.temperature_2m_max[0] : tempVal + 3);
    const todayLow = Math.round(daily.temperature_2m_min ? daily.temperature_2m_min[0] : tempVal - 4);
    document.getElementById('heroTodayHigh').textContent = `${todayHigh}${u}`;
    document.getElementById('heroTodayLow').textContent = `${todayLow}${u}`;

    // Hero stat pills
    const aqi = airQuality?.current?.us_aqi ?? Math.round(cur.relative_humidity_2m ? cur.relative_humidity_2m / 3 : 25);
    const aqiBadgeEl = document.getElementById('heroAqiStatus');
    document.getElementById('heroAqiVal').textContent = aqi;

    if (aqi <= 50) {
      aqiBadgeEl.textContent = 'Good (Clean)';
      aqiBadgeEl.style.color = '#34d399';
    } else if (aqi <= 100) {
      aqiBadgeEl.textContent = 'Moderate';
      aqiBadgeEl.style.color = '#fbbf24';
    } else if (aqi <= 150) {
      aqiBadgeEl.textContent = 'Sensitive';
      aqiBadgeEl.style.color = '#f97316';
    } else {
      aqiBadgeEl.textContent = 'Unhealthy';
      aqiBadgeEl.style.color = '#f43f5e';
    }

    const precipProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
    const precipSum = daily.precipitation_sum ? daily.precipitation_sum[0].toFixed(1) : '0.0';
    document.getElementById('heroPrecipProb').textContent = `${precipProb}%`;
    document.getElementById('heroPrecipSum').textContent = `${precipSum} ${State.units === 'imperial' ? 'in' : 'mm'} / 24h`;

    const uv = daily.uv_index_max ? daily.uv_index_max[0] : 3;
    document.getElementById('heroUvIndex').textContent = uv.toFixed(1);
    const uvRiskEl = document.getElementById('heroUvRisk');
    if (uv < 3) {
      uvRiskEl.textContent = 'Low Exposure';
      uvRiskEl.style.color = '#34d399';
    } else if (uv < 6) {
      uvRiskEl.textContent = 'Moderate';
      uvRiskEl.style.color = '#fbbf24';
    } else if (uv < 8) {
      uvRiskEl.textContent = 'Very High';
      uvRiskEl.style.color = '#f97316';
    } else {
      uvRiskEl.textContent = 'Extreme';
      uvRiskEl.style.color = '#f43f5e';
    }

    startLocalClock(weather.timezone || State.location.timezone);
  }

  // Render 6 Overview Cards
  function renderOverviewMetrics(weather, airQuality) {
    const cur = weather.current || {};
    const hourly = weather.hourly || {};
    const daily = weather.daily || {};
    const u = State.units === 'imperial' ? '°F' : '°C';
    const speedUnit = State.units === 'imperial' ? 'mph' : 'km/h';

    // 1. Temp & Dew Point
    const currentDew = hourly.dew_point_2m ? hourly.dew_point_2m[0] : (cur.temperature_2m - 5);
    document.getElementById('cardTempDewVal').innerHTML = `${Math.round(cur.temperature_2m ?? 0)}<span class="metric-unit">${u}</span>`;
    document.getElementById('cardDewPointVal').textContent = `${Math.round(currentDew)}${u}`;
    const spread = Math.abs(Math.round((cur.temperature_2m || 0) - currentDew));
    document.getElementById('cardDewSpreadVal').textContent = `${spread}${u}`;
    const tempPct = Math.min(100, Math.max(5, ((cur.temperature_2m + 10) / 45) * 100));
    document.getElementById('cardTempProgress').style.width = `${tempPct}%`;

    // 2. Wind & Dynamics
    const windSpeed = Math.round(cur.wind_speed_10m ?? 0);
    const windDirection = cur.wind_direction_10m ?? 0;
    const windGusts = Math.round(cur.wind_gusts_10m ?? windSpeed * 1.3);

    document.getElementById('cardWindSpeedVal').innerHTML = `${windSpeed}<span class="metric-unit">${speedUnit}</span>`;
    document.getElementById('compassNeedle').style.transform = `rotate(${windDirection}deg)`;

    const cardinalDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const dirIdx = Math.round(windDirection / 22.5) % 16;
    document.getElementById('cardWindDirectionText').textContent = `${cardinalDirections[dirIdx]} (${windDirection}°)`;
    document.getElementById('cardWindGustVal').textContent = `${windGusts} ${speedUnit}`;

    const beaufortEl = document.getElementById('cardWindBeaufort');
    if (windSpeed < 5) beaufortEl.textContent = 'Calm';
    else if (windSpeed < 20) beaufortEl.textContent = 'Moderate';
    else if (windSpeed < 40) beaufortEl.textContent = 'Strong Breeze';
    else beaufortEl.textContent = 'Gale / Severe';

    // 3. Moisture & Relative Humidity
    const humidity = cur.relative_humidity_2m ?? 50;
    document.getElementById('cardHumidityVal').innerHTML = `${humidity}<span class="metric-unit">%</span>`;
    document.getElementById('cardHumidityProgress').style.width = `${humidity}%`;

    const humidStatusEl = document.getElementById('cardHumidityStatus');
    if (humidity < 30) humidStatusEl.textContent = 'Dry Air';
    else if (humidity <= 65) humidStatusEl.textContent = 'Optimal Comfort';
    else humidStatusEl.textContent = 'High Saturation';

    const vaporPres = (6.112 * Math.exp((17.67 * (cur.temperature_2m || 15)) / ((cur.temperature_2m || 15) + 243.5)) * (humidity / 100)).toFixed(1);
    document.getElementById('cardVaporPressure').textContent = `Vapor: ${vaporPres} hPa`;

    // 4. Barometric Pressure
    const press = Math.round(cur.surface_pressure ?? cur.pressure_msl ?? 1013);
    const pressMsl = Math.round(cur.pressure_msl ?? press);
    document.getElementById('cardPressureVal').innerHTML = `${press}<span class="metric-unit">hPa</span>`;
    document.getElementById('cardPressureMsl').textContent = `${pressMsl} hPa`;

    const pressProgress = Math.min(100, Math.max(0, ((press - 970) / (1050 - 970)) * 100));
    document.getElementById('cardPressureProgress').style.width = `${pressProgress}%`;

    const tendencyEl = document.getElementById('cardPressureTendency');
    if (press > 1018) {
      tendencyEl.textContent = 'High / Stable';
    } else if (press < 1005) {
      tendencyEl.textContent = 'Low / Frontal';
    } else {
      tendencyEl.textContent = 'Equilibrium';
    }

    // 5. UV Radiation
    const uvNow = hourly.uv_index ? hourly.uv_index[0] : 2.5;
    const uvMax = daily.uv_index_max ? daily.uv_index_max[0] : 3.5;
    document.getElementById('cardUvMainVal').innerHTML = `${uvNow.toFixed(1)}<span class="metric-unit">/ 11+</span>`;
    document.getElementById('cardUvMaxVal').textContent = uvMax.toFixed(1);
    document.getElementById('cardUvProgress').style.width = `${Math.min(100, (uvNow / 11) * 100)}%`;

    const uvPill = document.getElementById('cardUvLevelPill');
    const protText = document.getElementById('cardSunProtectionText');
    if (uvNow < 3) {
      uvPill.textContent = 'Low Risk';
      protText.textContent = 'Protection not required';
    } else if (uvNow < 6) {
      uvPill.textContent = 'Moderate';
      protText.textContent = 'SPF 30 recommended';
    } else {
      uvPill.textContent = 'High Exposure';
      protText.textContent = 'Full sun protection mandatory';
    }

    // 6. Visibility & Clouds
    const cloudCover = cur.cloud_cover ?? 20;
    const visibilityKm = hourly.visibility ? (hourly.visibility[0] / 1000).toFixed(1) : '10.0';
    document.getElementById('cardVisibilityVal').innerHTML = `${visibilityKm}<span class="metric-unit">km</span>`;
    document.getElementById('cardCloudCoverVal').textContent = `${cloudCover}%`;
    document.getElementById('cardCloudCoverProgress').style.width = `${cloudCover}%`;

    const visStatus = document.getElementById('cardVisibilityStatus');
    if (parseFloat(visibilityKm) > 8) visStatus.textContent = 'Clear Horizon';
    else if (parseFloat(visibilityKm) > 4) visStatus.textContent = 'Hazy Atmosphere';
    else visStatus.textContent = 'Restricted Fog';

    // Render new visualization widgets
    renderComfortGauge(hourly, cur);
    renderWaffleChart(hourly);

    // Sun Schedule & Track
    if (daily.sunrise && daily.sunset) {
      const sunriseIso = daily.sunrise[0];
      const sunsetIso = daily.sunset[0];
      const sRiseDate = new Date(sunriseIso);
      const sSetDate = new Date(sunsetIso);

      document.getElementById('sunSunriseTime').textContent = sRiseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.getElementById('sunSunsetTime').textContent = sSetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const daylightMs = sSetDate - sRiseDate;
      const hours = Math.floor(daylightMs / (1000 * 60 * 60));
      const mins = Math.floor((daylightMs % (1000 * 60 * 60)) / (1000 * 60));
      document.getElementById('sunDaylightDuration').textContent = `${hours}h ${mins}m`;

      const now = new Date();
      if (now < sRiseDate) {
        document.getElementById('sunDayProgress').style.width = '0%';
        document.getElementById('sunCurrentPhase').textContent = 'Pre-dawn Horizon';
      } else if (now > sSetDate) {
        document.getElementById('sunDayProgress').style.width = '100%';
        document.getElementById('sunCurrentPhase').textContent = 'Nocturnal Cycle';
      } else {
        const elapsed = (now - sRiseDate) / daylightMs;
        document.getElementById('sunDayProgress').style.width = `${Math.round(elapsed * 100)}%`;
        document.getElementById('sunCurrentPhase').textContent = 'Solar Progression';
      }
    }

    // 7-Day Forecast Cards
    render7DayForecast(daily);
  }

  // Render 7-Day Synoptic Cards
  function render7DayForecast(daily) {
    const container = document.getElementById('forecast7DaysGrid');
    if (!container || !daily.time) return;

    container.innerHTML = '';
    const daysCount = Math.min(7, daily.time.length);
    const u = State.units === 'imperial' ? '°F' : '°C';

    // Find min and max across all 7 days for relative bar placement
    let globalMin = 999;
    let globalMax = -999;
    for (let i = 0; i < daysCount; i++) {
      if (daily.temperature_2m_min[i] < globalMin) globalMin = daily.temperature_2m_min[i];
      if (daily.temperature_2m_max[i] > globalMax) globalMax = daily.temperature_2m_max[i];
    }
    const globalRange = Math.max(1, globalMax - globalMin);

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(daily.time[i]);
      const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const maxT = Math.round(daily.temperature_2m_max[i]);
      const minT = Math.round(daily.temperature_2m_min[i]);
      const code = daily.weather_code[i] || 0;
      const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const meta = WeatherCodeMap[code] || { label: 'Clear', icon: 'sun' };

      // Relative bar coordinates
      const barLeft = Math.round(((daily.temperature_2m_min[i] - globalMin) / globalRange) * 100);
      const barWidth = Math.max(12, Math.round(((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / globalRange) * 100));

      const card = document.createElement('div');
      card.className = 'forecast-day-card';
      card.innerHTML = `
        <div class="forecast-day-title">${dayName}</div>
        <div class="forecast-day-date">${dateText}</div>
        <div class="forecast-day-icon">${getWeatherIconSvg(meta.icon, 1)}</div>
        <div class="forecast-temp-range tabular-nums">
          <span class="forecast-max">${maxT}°</span>
          <span class="forecast-min">${minT}°</span>
        </div>
        <div class="temp-comparison-bar">
          <div class="temp-comparison-fill" style="left:${barLeft}%;width:${barWidth}%;"></div>
        </div>
        <div class="forecast-rain-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          <span>${rainProb}%</span>
        </div>
      `;
      container.appendChild(card);
    }
  }

  // ==========================================
  // CANVAS CHART RENDERERS
  // ==========================================

  // Interactive 24-Hour Synoptic Chart
  function renderHourlyChart(hourly) {
    const canvas = document.getElementById('hourlyChartCanvas');
    if (!canvas || !hourly || !hourly.time) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padTop = 30;
    const padBottom = 35;
    const padLeft = 45;
    const padRight = 20;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Pick 24 hourly data points
    const pointsCount = 24;
    const times = hourly.time.slice(0, pointsCount);
    const temps = (hourly.temperature_2m || []).slice(0, pointsCount);
    const precips = (hourly.precipitation_probability || []).slice(0, pointsCount);
    const winds = (hourly.wind_speed_10m || []).slice(0, pointsCount);

    let activeData = temps;
    let unitLabel = State.units === 'imperial' ? '°F' : '°C';
    let lineColor = cssVar('--accent-primary', '#10b981');
    let gradTop = accentRgba(0.28);
    let gradBottom = accentRgba(0.0);

    if (State.chartLayer === 'precip') {
      activeData = precips;
      unitLabel = '%';
      lineColor = '#38bdf8';
      gradTop = 'rgba(56, 189, 248, 0.32)';
      gradBottom = 'rgba(56, 189, 248, 0.0)';
    } else if (State.chartLayer === 'wind') {
      activeData = winds;
      unitLabel = State.units === 'imperial' ? ' mph' : ' km/h';
      lineColor = cssVar('--accent-light', '#34d399');
      gradTop = accentRgba(0.25);
      gradBottom = accentRgba(0.0);
    }

    let minVal = Math.min(...activeData);
    let maxVal = Math.max(...activeData);
    if (minVal === maxVal) {
      minVal -= 2;
      maxVal += 2;
    }
    const range = maxVal - minVal;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw horizontal grid lines & Y labels
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.06)');
    ctx.lineWidth = 1;

    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (plotH / gridLines) * i;
      const val = Math.round(maxVal - (range / gridLines) * i);

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillText(`${val}${unitLabel}`, padLeft - 8, y);
    }

    // Compute point coordinates
    const coords = activeData.map((val, idx) => {
      const x = padLeft + (plotW / (pointsCount - 1)) * idx;
      const y = padTop + plotH - ((val - minVal) / range) * plotH;
      return { x, y, val, time: times[idx] };
    });

    // Draw Area Gradient Fill
    ctx.beginPath();
    ctx.moveTo(coords[0].x, padTop + plotH);
    ctx.lineTo(coords[0].x, coords[0].y);

    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.lineTo(coords[coords.length - 1].x, padTop + plotH);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    gradient.addColorStop(0, gradTop);
    gradient.addColorStop(1, gradBottom);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Smooth Line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw X-axis timestamps (every 3 hours)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    for (let i = 0; i < pointsCount; i += 3) {
      const d = new Date(times[i]);
      const hourStr = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      ctx.fillText(hourStr, coords[i].x, padTop + plotH + 8);
    }

    // Attach mouse move scrubbing
    canvas.onmousemove = function (e) {
      const mouseRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - mouseRect.left;

      if (mouseX < padLeft || mouseX > width - padRight) {
        hideTooltip();
        return;
      }

      // Find closest point
      let closest = coords[0];
      let minDiff = 9999;
      coords.forEach(pt => {
        const diff = Math.abs(pt.x - mouseX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      });

      showTooltip(closest, e.clientX, mouseRect.top + closest.y, unitLabel);
    };

    canvas.onmouseleave = hideTooltip;
  }

  function showTooltip(point, clientX, clientY, unitLabel) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;
    const d = new Date(point.time);
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    tooltip.innerHTML = `
      <div style="font-size:10.5px;color:#94a3b8;margin-bottom:2px;">${timeStr}</div>
      <div style="font-size:14px;font-weight:700;color:#f1f5f9;">${Math.round(point.val)}${unitLabel}</div>
    `;
    tooltip.style.left = `${point.x}px`;
    tooltip.style.top = `${point.y}px`;
    tooltip.style.opacity = '1';
  }

  function hideTooltip() {
    const tooltip = document.getElementById('chartTooltip');
    if (tooltip) tooltip.style.opacity = '0';
  }

  // 48-Hour Multi-Metric Deep Trend Canvas
  function renderMultiMetricChart(hourly) {
    const canvas = document.getElementById('multiMetricCanvas');
    if (!canvas || !hourly || !hourly.time) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padTop = 24;
    const padBottom = 30;
    const padLeft = 40;
    const padRight = 20;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const count = Math.min(48, hourly.time.length);
    const times = hourly.time.slice(0, count);
    const temps = (hourly.temperature_2m || []).slice(0, count);
    const feels = (hourly.apparent_temperature || []).slice(0, count);
    const dews = (hourly.dew_point_2m || []).slice(0, count);

    const all = [...temps, ...feels, ...dews];
    let minVal = Math.min(...all) - 1;
    let maxVal = Math.max(...all) + 1;
    const range = Math.max(1, maxVal - minVal);

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.06)');
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      const label = Math.round(maxVal - (range / 4) * i);
      ctx.fillStyle = cssVar('--chart-axis', '#64748b');
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${label}°`, padLeft - 6, y + 3);
    }

    function drawSeries(series, color, lineWidth = 2) {
      ctx.beginPath();
      series.forEach((val, i) => {
        const x = padLeft + (plotW / (count - 1)) * i;
        const y = padTop + plotH - ((val - minVal) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    // Secondary series keep consistent hues; primary follows the active accent
    drawSeries(dews, '#38bdf8', 1.8);
    drawSeries(feels, '#f59e0b', 1.8);
    drawSeries(temps, cssVar('--accent-primary', '#10b981'), 2.4);

    // Chart Legend
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';

    const accentPrimary = cssVar('--accent-primary', '#10b981');
    ctx.fillStyle = accentPrimary;
    ctx.fillRect(padLeft, 10, 10, 3);
    ctx.fillText('Temperature', padLeft + 14, 13);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(padLeft + 110, 10, 10, 3);
    ctx.fillText('Apparent (Feels)', padLeft + 124, 13);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 240, 10, 10, 3);
    ctx.fillText('Dew Point', padLeft + 254, 13);

    // Weather condition distribution stats
    renderWeatherDistribution(hourly);
  }

  // Weather distribution donut & climate indicators
  function renderWeatherDistribution(hourly) {
    if (!hourly.cloud_cover || !hourly.weather_code) return;
    renderPieChart(hourly);

    let clearCount = 0;
    let cloudCount = 0;
    let rainCount = 0;
    const total = Math.min(48, hourly.cloud_cover.length);

    for (let i = 0; i < total; i++) {
      const code = hourly.weather_code[i] || 0;
      const clouds = hourly.cloud_cover[i] || 0;
      if (code >= 51 || (hourly.precipitation && hourly.precipitation[i] > 0.1)) {
        rainCount++;
      } else if (clouds > 50) {
        cloudCount++;
      } else {
        clearCount++;
      }
    }

    const clearPct = Math.round((clearCount / total) * 100);
    const cloudPct = Math.round((cloudCount / total) * 100);
    const rainPct = Math.max(0, 100 - clearPct - cloudPct);

    document.getElementById('legendClearPct').textContent = `${clearPct}%`;
    document.getElementById('legendCloudPct').textContent = `${cloudPct}%`;
    document.getElementById('legendRainPct').textContent = `${rainPct}%`;

    const cCirc = 2 * Math.PI * 38; // 238.76
    const segClear = (clearPct / 100) * cCirc;
    const segCloud = (cloudPct / 100) * cCirc;
    const segRain = (rainPct / 100) * cCirc;

    const elClear = document.getElementById('donutClear');
    const elClouds = document.getElementById('donutClouds');
    const elRain = document.getElementById('donutRain');

    if (elClear && elClouds && elRain) {
      elClear.setAttribute('stroke-dasharray', `${segClear} ${cCirc}`);
      elClear.setAttribute('stroke-dashoffset', '0');

      elClouds.setAttribute('stroke-dasharray', `${segCloud} ${cCirc}`);
      elClouds.setAttribute('stroke-dashoffset', `${-segClear}`);

      elRain.setAttribute('stroke-dasharray', `${segRain} ${cCirc}`);
      elRain.setAttribute('stroke-dashoffset', `${-(segClear + segCloud)}`);
    }

    // Climate statistics row
    if (State.weatherData?.daily) {
      const d = State.weatherData.daily;
      const swing = Math.round((d.temperature_2m_max[0] || 20) - (d.temperature_2m_min[0] || 10));
      const u = State.units === 'imperial' ? '°F' : '°C';
      document.getElementById('statDiurnalSwing').innerHTML = `${swing}<span class="metric-unit">${u}</span>`;

      const rainTotal = (d.precipitation_sum || []).slice(0, 7).reduce((a, b) => a + b, 0).toFixed(1);
      const rUnit = State.units === 'imperial' ? 'in' : 'mm';
      document.getElementById('statMoistureAcc').innerHTML = `${rainTotal}<span class="metric-unit">${rUnit}</span>`;

      const rad = ((d.shortwave_radiation_sum ? d.shortwave_radiation_sum[0] : 16.5) || 16.5).toFixed(1);
      document.getElementById('statSolarRadiation').innerHTML = `${rad}<span class="metric-unit">MJ/m²</span>`;
    }
  }

  // Air Quality Detailed View
  function renderAirQualityView(airQuality) {
    if (!airQuality || !airQuality.current) return;
    const cur = airQuality.current;

    const usAqi = cur.us_aqi ?? 32;
    const eaAqi = cur.european_aqi ?? 2;

    document.getElementById('aqiMainNumber').textContent = usAqi;
    document.getElementById('aqiEuropeanIndex').textContent = `${eaAqi} EAQI`;

    // Circular Gauge Animation
    const circle = document.getElementById('aqiCircleGauge');
    const badge = document.getElementById('aqiMainBadge');
    const headline = document.getElementById('aqiHeadlineText');
    const desc = document.getElementById('aqiDescText');

    const totalDash = 251.2;
    const pct = Math.min(1, usAqi / 300);
    const offset = totalDash - totalDash * pct;
    if (circle) {
      circle.style.strokeDashoffset = offset;
    }

    if (usAqi <= 50) {
      if (circle) circle.style.stroke = '#10b981';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#34d399';
      badge.textContent = 'Good Air Quality';
      headline.textContent = 'Atmospheric Quality is Clean and Optimal';
      desc.textContent = 'Air quality is considered satisfactory, and air pollution poses little or no risk. Both ambient particulate matter and gaseous emissions are well within international World Health Organization (WHO) safety guidelines.';
    } else if (usAqi <= 100) {
      if (circle) circle.style.stroke = '#f59e0b';
      badge.style.background = 'rgba(245, 158, 11, 0.15)';
      badge.style.color = '#fbbf24';
      badge.textContent = 'Moderate Air Quality';
      headline.textContent = 'Acceptable Ambient Conditions';
      desc.textContent = 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of individuals who are unusually sensitive to ozone or particulate matter.';
    } else {
      if (circle) circle.style.stroke = '#f43f5e';
      badge.style.background = 'rgba(244, 63, 94, 0.15)';
      badge.style.color = '#fb7185';
      badge.textContent = 'Unhealthy Atmosphere';
      headline.textContent = 'Elevated Particulate / Gaseous Concentration';
      desc.textContent = 'Members of sensitive groups may experience health effects. The general public is likely to be affected during prolonged outdoor physical exertion.';
    }

    // 6 Pollutants
    const pm25 = (cur.pm2_5 ?? 8.4).toFixed(1);
    const pm10 = (cur.pm10 ?? 16.2).toFixed(1);
    const o3 = (cur.ozone ?? 48.0).toFixed(1);
    const no2 = (cur.nitrogen_dioxide ?? 14.5).toFixed(1);
    const so2 = (cur.sulphur_dioxide ?? 3.2).toFixed(1);
    const co = (cur.carbon_monoxide ?? 280).toFixed(0);

    document.getElementById('pm25Val').innerHTML = `${pm25} <span class="pollutant-unit">µg/m³</span>`;
    document.getElementById('pm10Val').innerHTML = `${pm10} <span class="pollutant-unit">µg/m³</span>`;
    document.getElementById('o3Val').innerHTML = `${o3} <span class="pollutant-unit">µg/m³</span>`;
    document.getElementById('no2Val').innerHTML = `${no2} <span class="pollutant-unit">µg/m³</span>`;
    document.getElementById('so2Val').innerHTML = `${so2} <span class="pollutant-unit">µg/m³</span>`;
    document.getElementById('coVal').innerHTML = `${co} <span class="pollutant-unit">µg/m³</span>`;

    // Progress vs WHO guidelines (PM2.5: 15, PM10: 45, O3: 100, NO2: 25, SO2: 40, CO: 4000)
    document.getElementById('pm25Progress').style.width = `${Math.min(100, (pm25 / 15) * 100)}%`;
    document.getElementById('pm25Ratio').textContent = `${Math.round((pm25 / 15) * 100)}% of limit`;

    document.getElementById('pm10Progress').style.width = `${Math.min(100, (pm10 / 45) * 100)}%`;
    document.getElementById('pm10Ratio').textContent = `${Math.round((pm10 / 45) * 100)}% of limit`;

    document.getElementById('o3Progress').style.width = `${Math.min(100, (o3 / 100) * 100)}%`;
    document.getElementById('o3Ratio').textContent = `${Math.round((o3 / 100) * 100)}% of limit`;

    document.getElementById('no2Progress').style.width = `${Math.min(100, (no2 / 25) * 100)}%`;
    document.getElementById('no2Ratio').textContent = `${Math.round((no2 / 25) * 100)}% of limit`;

    document.getElementById('so2Progress').style.width = `${Math.min(100, (so2 / 40) * 100)}%`;
    document.getElementById('so2Ratio').textContent = `${Math.round((so2 / 40) * 100)}% of limit`;

    document.getElementById('coProgress').style.width = `${Math.min(100, (co / 4000) * 100)}%`;
    document.getElementById('coRatio').textContent = `${Math.round((co / 4000) * 100)}% of limit`;

    // Activity Advisories
    if (usAqi <= 50) {
      document.getElementById('advOutdoor').textContent = 'Ideal conditions for intense workouts.';
      document.getElementById('advVentilation').textContent = 'Safe to open windows for clean air.';
      document.getElementById('advSensitive').textContent = 'No restrictions for sensitive individuals.';
      document.getElementById('advMask').textContent = 'Respirator mask not required outdoors.';
    } else if (usAqi <= 100) {
      document.getElementById('advOutdoor').textContent = 'Safe for general public; sensitive take pauses.';
      document.getElementById('advVentilation').textContent = 'Open windows during early morning.';
      document.getElementById('advSensitive').textContent = 'Notice mild respiratory irritation if sensitive.';
      document.getElementById('advMask').textContent = 'Masks optional for high-traffic zones.';
    } else {
      document.getElementById('advOutdoor').textContent = 'Reduce prolonged outdoor exertion.';
      document.getElementById('advVentilation').textContent = 'Keep windows closed; filter air indoors.';
      document.getElementById('advSensitive').textContent = 'Sensitive groups avoid outdoor activities.';
      document.getElementById('advMask').textContent = 'Consider N95 / KN95 when walking near roads.';
    }
  }

  // 14-Day Extended Synoptic Table
  function render14DayTable(daily) {
    const tbody = document.getElementById('forecastTableBody');
    if (!tbody || !daily || !daily.time) return;

    tbody.innerHTML = '';
    const u = State.units === 'imperial' ? '°F' : '°C';
    const sUnit = State.units === 'imperial' ? 'mph' : 'km/h';
    const rUnit = State.units === 'imperial' ? 'in' : 'mm';

    // Global min / max for range bars
    let minT = 999;
    let maxT = -999;
    daily.time.forEach((_, i) => {
      if (daily.temperature_2m_min[i] < minT) minT = daily.temperature_2m_min[i];
      if (daily.temperature_2m_max[i] > maxT) maxT = daily.temperature_2m_max[i];
    });
    const totalRange = Math.max(1, maxT - minT);

    daily.time.forEach((t, i) => {
      const date = new Date(t);
      const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dMin = Math.round(daily.temperature_2m_min[i]);
      const dMax = Math.round(daily.temperature_2m_max[i]);
      const code = daily.weather_code[i] || 0;
      const meta = WeatherCodeMap[code] || { label: 'Clear Sky', icon: 'sun' };

      const leftPct = Math.round(((daily.temperature_2m_min[i] - minT) / totalRange) * 100);
      const widthPct = Math.max(8, Math.round(((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / totalRange) * 100));

      const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const rainSum = daily.precipitation_sum ? daily.precipitation_sum[i].toFixed(1) : '0.0';
      const windSpeed = Math.round(daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : 14);
      const windGusts = Math.round(daily.wind_gusts_10m_max ? daily.wind_gusts_10m_max[i] : windSpeed * 1.3);
      const uvMax = daily.uv_index_max ? daily.uv_index_max[i].toFixed(1) : '3.0';

      const sRise = daily.sunrise ? new Date(daily.sunrise[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
      const sSet = daily.sunset ? new Date(daily.sunset[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:600;color:#f8fafc;">${dayName}</div>
          <div style="font-size:11px;color:#64748b;">${dateStr}</div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:24px;height:24px;">${getWeatherIconSvg(meta.icon, 1)}</div>
            <span>${meta.label}</span>
          </div>
        </td>
        <td class="table-range-bar-cell">
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;" class="tabular-nums">
            <span style="color:#64748b;width:28px;text-align:right;">${dMin}°</span>
            <div class="temp-comparison-bar" style="flex:1;">
              <div class="temp-comparison-fill" style="left:${leftPct}%;width:${widthPct}%;"></div>
            </div>
            <span style="color:#f8fafc;width:28px;">${dMax}°</span>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;color:#38bdf8;" class="tabular-nums">
            <span>${rainProb}%</span>
            <span style="font-size:11px;color:#64748b;">(${rainSum} ${rUnit})</span>
          </div>
        </td>
        <td class="tabular-nums">
          <div>${windSpeed} ${sUnit}</div>
          <div style="font-size:11px;color:#64748b;">Gusts: ${windGusts} ${sUnit}</div>
        </td>
        <td>
          <span class="card-badge ${parseFloat(uvMax) > 5 ? 'amber' : 'emerald'}">${uvMax}</span>
        </td>
        <td style="font-size:11.5px;color:#94a3b8;" class="tabular-nums">
          ${sRise} — ${sSet}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ==========================================
  // CITY COMPARISONS
  // ==========================================
  function roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  async function loadComparison(force) {
    const now = Date.now();
    if (!force && State.comparisonData && State.comparisonUnits === State.units && (now - State.comparisonLoadedAt) < 10 * 60 * 1000) {
      renderComparison(State.comparisonData);
      return;
    }

    const cities = [{ ...State.location, isCurrent: true }, ...ComparisonCities];
    const badge = document.getElementById('compareLiveBadge');
    if (badge) badge.textContent = 'Fetching...';

    const results = await Promise.all(cities.map(async (c) => {
      try {
        const weather = await ApiClient.fetchWeather(c.latitude, c.longitude, State.units);
        return { ...c, weather };
      } catch (_) {
        return null;
      }
    }));

    State.comparisonData = results.filter(Boolean);
    State.comparisonUnits = State.units;
    State.comparisonLoadedAt = Date.now();

    if (badge) badge.textContent = 'Live';
    renderComparison(State.comparisonData);
    renderBubbleChart(State.comparisonData);
  }

  function renderComparison(data) {
    if (!data || !data.length) return;
    renderComparisonBars(data);
    renderComparisonCards(data);
  }

  // Refresh the "About & Preferences" readouts on the Settings tab
  function refreshSettingsMeta() {
    const unitsVal = document.getElementById('settingsUnitsVal');
    if (unitsVal) {
      unitsVal.textContent = State.units === 'imperial' ? 'Imperial (°F, mph, in)' : 'Metric (°C, km/h, mm)';
    }
    const recentCount = document.getElementById('settingsRecentCount');
    if (recentCount) recentCount.textContent = `${State.recentlyViewed.length} station${State.recentlyViewed.length === 1 ? '' : 's'}`;
    const lastSync = document.getElementById('settingsLastSync');
    if (lastSync) lastSync.textContent = new Date().toLocaleTimeString();
  }

  function renderComparisonBars(data) {
    const canvas = document.getElementById('compareTempCanvas');
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const u = State.units === 'imperial' ? '°F' : '°C';

    const sorted = [...data].sort((a, b) => (b.weather.current?.temperature_2m || 0) - (a.weather.current?.temperature_2m || 0));
    const temps = sorted.map(c => c.weather.current?.temperature_2m || 0);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const range = Math.max(1, maxTemp - minTemp);

    const rowH = Math.min(40, (height - 20) / sorted.length);
    const labelW = 110;
    const valueW = 70;
    const barMaxW = width - labelW - valueW - 20;

    const axisColor = cssVar('--chart-axis', '#64748b');
    const trackColor = cssVar('--track-fill', 'rgba(255, 255, 255, 0.05)');
    const textMain = cssVar('--text-main', '#f8fafc');
    const mutedColor = cssVar('--text-muted', '#94a3b8');
    const accentPrimary = cssVar('--accent-primary', '#10b981');
    const accentSecondary = cssVar('--accent-secondary', '#059669');
    const accentLight = cssVar('--accent-light', '#34d399');

    ctx.clearRect(0, 0, width, height);

    sorted.forEach((city, i) => {
      const temp = city.weather.current?.temperature_2m || 0;
      const y = 10 + i * rowH;
      const barH = Math.min(20, rowH - 12);
      const barW = 16 + ((temp - minTemp) / range) * (barMaxW - 16);

      // City label
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = city.isCurrent ? accentLight : mutedColor;
      ctx.fillText(city.name, labelW - 10, y + rowH / 2);

      // Track
      ctx.fillStyle = trackColor;
      roundedRectPath(ctx, labelW, y + (rowH - barH) / 2, barMaxW, barH, barH / 2);
      ctx.fill();

      // Fill (gradient)
      const grad = ctx.createLinearGradient(labelW, 0, labelW + barMaxW, 0);
      if (city.isCurrent) {
        grad.addColorStop(0, accentSecondary);
        grad.addColorStop(1, accentLight);
      } else {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#38bdf8');
      }
      ctx.fillStyle = grad;
      roundedRectPath(ctx, labelW, y + (rowH - barH) / 2, barW, barH, barH / 2);
      ctx.fill();

      // Value
      ctx.textAlign = 'left';
      ctx.fillStyle = textMain;
      ctx.font = '600 12.5px Inter, sans-serif';
      ctx.fillText(`${Math.round(temp)}${u}`, labelW + barW + 10, y + rowH / 2);
    });
  }

  function renderComparisonCards(data) {
    const grid = document.getElementById('compareCardsGrid');
    if (!grid) return;

    const u = State.units === 'imperial' ? '°F' : '°C';
    const sUnit = State.units === 'imperial' ? 'mph' : 'km/h';
    const sorted = [...data].sort((a, b) => (b.weather.current?.temperature_2m || 0) - (a.weather.current?.temperature_2m || 0));

    grid.innerHTML = '';
    sorted.forEach((city) => {
      const cur = city.weather.current || {};
      const code = cur.weather_code ?? 0;
      const meta = WeatherCodeMap[code] || { label: 'Clear', icon: 'sun' };
      const pill = city.isCurrent ? '<span class="compare-current-pill">Active</span>' : '';

      const card = document.createElement('div');
      card.className = 'compare-city-card' + (city.isCurrent ? ' is-current' : '');
      card.innerHTML = `
        <div class="compare-city-header">
          <span class="compare-city-name">${city.name}</span>
          <span style="display:flex;align-items:center;gap:6px;">${pill}<span class="compare-city-country">${city.country || ''}</span></span>
        </div>
        <div class="compare-city-body">
          <div class="compare-city-icon">${getWeatherIconSvg(meta.icon, cur.is_day ?? 1)}</div>
          <div class="compare-city-temp tabular-nums">${Math.round(cur.temperature_2m ?? 0)}<span>${u}</span></div>
        </div>
        <div class="compare-city-meta">
          <span>Condition: <b>${meta.label}</b></span>
          <span>Wind: <b>${Math.round(cur.wind_speed_10m ?? 0)} ${sUnit}</b></span>
          <span>Humidity: <b>${Math.round(cur.relative_humidity_2m ?? 0)}%</b></span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ==========================================
  // ADVANCED VISUALIZATIONS
  // ==========================================

  // 48-Hour Wind Rose (polar frequency / intensity plot)
  function renderWindRose(hourly) {
    const canvas = document.getElementById('windRoseCanvas');
    if (!canvas || !hourly || !hourly.wind_direction_10m) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) / 2 - 34;

    const dirs = (hourly.wind_direction_10m || []).slice(0, 48);
    const speeds = (hourly.wind_speed_10m || []).slice(0, 48);
    const sectors = 16;
    const sectorSize = 360 / sectors;
    const freq = new Array(sectors).fill(0);
    const speedSum = new Array(sectors).fill(0);

    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i] ?? 0;
      const sector = Math.floor(((d + sectorSize / 2) % 360) / sectorSize);
      freq[sector]++;
      speedSum[sector] += speeds[i] ?? 0;
    }

    const maxFreq = Math.max(1, ...freq);
    const maxAvg = Math.max(1, ...speedSum.map((s, i) => (freq[i] ? s / freq[i] : 0)));

    ctx.clearRect(0, 0, width, height);

    const windAccentRgb = cssVar('--accent-rgb', '16, 185, 129');
    const axisColor = cssVar('--chart-axis', '#64748b');
    const mutedColor = cssVar('--text-muted', '#94a3b8');
    const gridColor = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.07)');

    // Concentric rings
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxR * r) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial wedges colored by average intensity
    freq.forEach((f, i) => {
      if (f === 0) return;
      const len = (f / maxFreq) * maxR;
      const avg = speedSum[i] / f;
      const intensity = avg / maxAvg;
      const startAngle = ((i * sectorSize - sectorSize / 2) * Math.PI) / 180 - Math.PI / 2;
      const endAngle = ((i * sectorSize + sectorSize / 2) * Math.PI) / 180 - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, len, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `rgba(${windAccentRgb}, ${0.18 + intensity * 0.62})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${windAccentRgb}, 0.45)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = cssVar('--accent-primary', '#10b981');
    ctx.fill();

    // Cardinal labels
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = mutedColor;
    ctx.fillText('N', cx, cy - maxR - 12);
    ctx.fillText('E', cx + maxR + 16, cy);
    ctx.fillText('S', cx, cy + maxR + 16);
    ctx.fillText('W', cx - maxR - 16, cy);
  }

  // 24-Hour Precipitation Flux (bar chart)
  function renderPrecipBars(hourly) {
    const canvas = document.getElementById('precipBarsCanvas');
    if (!canvas || !hourly || !hourly.time) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padTop = 22;
    const padBottom = 28;
    const padLeft = 38;
    const padRight = 10;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const count = 24;
    const times = (hourly.time || []).slice(0, count);
    const precip = (hourly.precipitation || []).slice(0, count);
    const maxP = Math.max(1, ...precip);

    ctx.clearRect(0, 0, width, height);

    // Grid + Y labels
    ctx.strokeStyle = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.06)');
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = padTop + plotH - (plotH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(((maxP / 3) * i).toFixed(1), padLeft - 6, y);
    }

    // Bars
    const barW = plotW / count;
    precip.forEach((p, i) => {
      const x = padLeft + i * barW;
      const barH = (p / maxP) * plotH;
      const y = padTop + plotH - barH;
      ctx.fillStyle = p > 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(x + barW * 0.18, y, barW * 0.64, barH);
    });

    // X labels every 3 hours
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    for (let i = 0; i < count; i += 3) {
      const d = new Date(times[i]);
      ctx.fillText(d.toLocaleTimeString([], { hour: 'numeric', hour12: true }), padLeft + i * barW + barW / 2, padTop + plotH + 8);
    }
  }

  // 48-Hour Barometric Pressure Trajectory (area chart)
  function renderPressureTrend(hourly) {
    const canvas = document.getElementById('pressureTrendCanvas');
    if (!canvas || !hourly || !hourly.time || !hourly.pressure_msl) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padTop = 22;
    const padBottom = 28;
    const padLeft = 42;
    const padRight = 14;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const count = Math.min(48, hourly.time.length);
    const times = hourly.time.slice(0, count);
    const pressure = (hourly.pressure_msl || []).slice(0, count);

    const minP = Math.min(...pressure) - 1;
    const maxP = Math.max(...pressure) + 1;
    const range = Math.max(1, maxP - minP);

    ctx.clearRect(0, 0, width, height);

    const pressAccentRgb = cssVar('--accent-rgb', '16, 185, 129');
    const pressAccent = cssVar('--accent-primary', '#10b981');

    ctx.strokeStyle = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.06)');
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (plotH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(Math.round(maxP - (range / 3) * i), padLeft - 6, y);
    }

    const coords = pressure.map((p, i) => ({
      x: padLeft + (plotW / (count - 1)) * i,
      y: padTop + plotH - ((p - minP) / range) * plotH
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(coords[0].x, padTop + plotH);
    coords.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, padTop + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, `rgba(${pressAccentRgb}, 0.28)`);
    grad.addColorStop(1, `rgba(${pressAccentRgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    coords.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.strokeStyle = pressAccent;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // X labels every 6 hours
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    for (let i = 0; i < count; i += 6) {
      const d = new Date(times[i]);
      ctx.fillText(d.toLocaleTimeString([], { hour: 'numeric', hour12: true }), coords[i].x, padTop + plotH + 8);
    }
  }

  // 48-Hour Air Quality Index Trajectory
  function renderAqiTrend(airQuality) {
    const canvas = document.getElementById('aqiTrendCanvas');
    if (!canvas || !airQuality || !airQuality.hourly || !airQuality.hourly.time) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padTop = 24;
    const padBottom = 28;
    const padLeft = 38;
    const padRight = 14;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const count = Math.min(48, airQuality.hourly.time.length);
    const times = airQuality.hourly.time.slice(0, count);
    const usAqi = (airQuality.hourly.us_aqi || []).slice(0, count);
    const euAqi = (airQuality.hourly.european_aqi || []).slice(0, count);

    const maxAqi = Math.max(50, ...usAqi);
    const minAqi = Math.min(0, ...usAqi);
    const range = Math.max(1, maxAqi - minAqi);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = cssVar('--chart-grid', 'rgba(255, 255, 255, 0.06)');
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (plotH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(Math.round(maxAqi - (range / 3) * i), padLeft - 6, y);
    }

    function drawLine(series, color, lineWidth) {
      const coords = series.map((v, i) => ({
        x: padLeft + (plotW / (count - 1)) * i,
        y: padTop + plotH - ((v - minAqi) / range) * plotH
      }));
      ctx.beginPath();
      coords.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      return coords;
    }

    const aqiAccent = cssVar('--accent-primary', '#10b981');
    const usCoords = drawLine(usAQI, aqiAccent, 2.2);
    drawLine(euAQI.map(v => v * 20), '#38bdf8', 1.6);

    // Legend
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = aqiAccent;
    ctx.fillRect(padLeft, 8, 10, 3);
    ctx.fillText('US AQI', padLeft + 14, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 68, 8, 10, 3);
    ctx.fillText('European AQI (×20)', padLeft + 82, 10);

    // X labels every 8 hours
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cssVar('--chart-axis', '#64748b');
    ctx.font = '10px Inter, sans-serif';
    for (let i = 0; i < count; i += 8) {
      const d = new Date(times[i]);
      ctx.fillText(d.toLocaleTimeString([], { hour: 'numeric', hour12: true }), usCoords[i].x, padTop + plotH + 8);
    }
  }

  // ==========================================
  // ADDITIONAL VISUALIZATIONS
  // ==========================================

  // Radar Chart — multi-parameter weather profile
  function renderRadarChart(hourly) {
    const canvas = document.getElementById('radarChartCanvas');
    if (!canvas || !hourly) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 40;

    const accent = cssVar('--accent-primary', '#10b981');
    const accentLight = cssVar('--accent-light', '#34d399');
    const grid = cssVar('--chart-grid', 'rgba(255,255,255,0.08)');
    const axis = cssVar('--chart-axis', '#64748b');
    const muted = cssVar('--text-muted', '#94a3b8');

    // Sample 48 hours
    const n = Math.min(48, (hourly.temperature_2m || []).length);
    if (!n) return;

    function avg(arr) {
      const a = (arr || []).slice(0, n).filter(v => v != null && !isNaN(v));
      return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
    }

    // Normalized metrics (0..1)
    const temp = avg(hourly.temperature_2m);
    const humidity = avg(hourly.relative_humidity_2m);
    const wind = avg(hourly.wind_speed_10m);
    const pressure = avg(hourly.pressure_msl || []);
    const uv = avg(hourly.uv_index || []);
    const cloud = avg(hourly.cloud_cover);

    const u = State.units === 'imperial' ? '°F' : '°C';
    // Normalize each to 0..1 across sensible bounds
    const metrics = [
      { label: 'Temp', val: (temp - (-10)) / 50, display: `${Math.round(temp)}${u}` },
      { label: 'Humidity', val: humidity / 100, display: `${Math.round(humidity)}%` },
      { label: 'Wind', val: wind / 40, display: `${Math.round(wind)} ${State.units === 'imperial' ? 'mph' : 'km/h'}` },
      { label: 'Pressure', val: (pressure - 960) / (1040 - 960), display: `${Math.round(pressure)}hPa` },
      { label: 'UV', val: Math.min(1, uv / 10), display: uv.toFixed(1) },
      { label: 'Cloud', val: cloud / 100, display: `${Math.round(cloud)}%` }
    ].map(m => ({ ...m, val: Math.max(0.05, Math.min(1, m.val)) }));

    const N = metrics.length;
    const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;

    ctx.clearRect(0, 0, w, h);

    // Concentric polygon rings
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      const rr = (r * ring) / 4;
      for (let i = 0; i < N; i++) {
        const a = angle(i);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis lines + labels
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const a = angle(i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = grid;
      ctx.stroke();

      const lx = cx + Math.cos(a) * (r + 24);
      const ly = cy + Math.sin(a) * (r + 24);
      ctx.fillStyle = muted;
      ctx.fillText(metrics[i].label, lx, ly);
    }

    // Filled polygon
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = angle(i);
      const rr = r * metrics[i].val;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = accentRgba(0.22);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertex points with values
    for (let i = 0; i < N; i++) {
      const a = angle(i);
      const rr = r * metrics[i].val;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = accentLight;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Comfort Gauge — semicircular meter
  function renderComfortGauge(hourly, current) {
    const fill = document.getElementById('comfortGaugeFill');
    const value = document.getElementById('comfortGaugeValue');
    const label = document.getElementById('comfortGaugeLabel');
    if (!fill || !value || !label) return;

    const u = State.units === 'imperial' ? '°F' : '°C';
    const temp = current?.temperature_2m ?? 20;
    const humidity = current?.relative_humidity_2m ?? 50;
    const wind = current?.wind_speed_10m ?? 5;

    // Heat index / wind chill based comfort score 0..100
    let score;
    if (State.units === 'imperial') {
      if (temp >= 80) {
        const hi = -42.379 + 2.04901523 * temp + 10.14333127 * humidity - 0.22475541 * temp * humidity;
        score = Math.max(0, 100 - Math.max(0, hi - 75) * 3.2);
      } else if (temp <= 50) {
        const wc = 35.74 + 0.6215 * temp - 35.75 * Math.pow(wind, 0.16);
        score = Math.max(0, 100 - Math.max(0, 55 - wc) * 3.2);
      } else {
        score = 85 - Math.abs(temp - 72) * 1.8 - Math.abs(humidity - 45) * 0.5;
      }
    } else {
      if (temp >= 27) {
        const hi = -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity;
        score = Math.max(0, 100 - Math.max(0, hi - 24) * 3.2);
      } else if (temp <= 10) {
        const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16);
        score = Math.max(0, 100 - Math.max(0, 13 - wc) * 3.2);
      } else {
        score = 85 - Math.abs(temp - 22) * 1.8 - Math.abs(humidity - 45) * 0.5;
      }
    }
    score = Math.max(0, Math.min(100, score));

    // Arc length: semicircle (π*r where r=80 → ~251.2)
    const arcLen = Math.PI * 80;
    const filled = arcLen * (score / 100);
    fill.setAttribute('stroke-dasharray', `${filled.toFixed(2)} ${arcLen.toFixed(2)}`);

    const accent = cssVar('--accent-primary', '#10b981');
    fill.style.stroke = accent;
    value.textContent = Math.round(score);
    value.style.color = accent;

    let lbl = 'Comfortable';
    if (score >= 75) lbl = 'Very Comfortable';
    else if (score >= 55) lbl = 'Comfortable';
    else if (score >= 35) lbl = 'Moderate Stress';
    else if (score >= 15) lbl = 'High Stress';
    else lbl = 'Extreme Stress';
    label.textContent = lbl;
  }

  // Waffle Chart — precipitation probability grid
  function renderWaffleChart(hourly) {
    const grid = document.getElementById('precipWaffleGrid');
    const pctEl = document.getElementById('wafflePrecipPct');
    if (!grid || !hourly) return;

    const probs = (hourly.precipitation_probability || []).slice(0, 12);
    if (!probs.length) return;
    const avg = probs.reduce((s, v) => s + (v || 0), 0) / probs.length;
    const filled = Math.round((avg / 100) * 100);

    if (grid.children.length !== 100) {
      grid.innerHTML = '';
      for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'waffle-cell';
        grid.appendChild(cell);
      }
    }

    Array.from(grid.children).forEach((cell, i) => {
      cell.classList.toggle('filled', i < filled);
    });
    if (pctEl) pctEl.textContent = `${Math.round(avg)}%`;
  }

  // Pie Chart — sky condition composition
  function renderPieChart(hourly) {
    const group = document.getElementById('pieSlicesGroup');
    const legend = document.getElementById('pieLegend');
    if (!group || !legend || !hourly) return;

    const total = Math.min(48, (hourly.cloud_cover || []).length);
    if (!total) return;

    let clear = 0, cloudy = 0, rain = 0;
    for (let i = 0; i < total; i++) {
      const code = hourly.weather_code?.[i] || 0;
      const cloud = hourly.cloud_cover?.[i] || 0;
      if (code >= 51 || (hourly.precipitation?.[i] || 0) > 0.1) rain++;
      else if (cloud > 50) cloudy++;
      else clear++;
    }

    const slices = [
      { label: 'Clear / Fair', count: clear, color: cssVar('--accent-primary', '#10b981') },
      { label: 'Cloudy', count: cloudy, color: '#38bdf8' },
      { label: 'Rain / Storm', count: rain, color: '#f59e0b' }
    ].filter(s => s.count > 0);

    const C = 2 * Math.PI * 38;
    let offset = 0;
    group.innerHTML = '';
    legend.innerHTML = '';

    slices.forEach(s => {
      const frac = s.count / total;
      const len = C * frac;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '38');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', s.color);
      circle.setAttribute('stroke-width', '18');
      circle.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(C - len).toFixed(2)}`);
      circle.setAttribute('stroke-dashoffset', (-offset).toFixed(2));
      circle.setAttribute('transform', 'rotate(-90 50 50)');
      group.appendChild(circle);
      offset += len;

      const item = document.createElement('div');
      item.className = 'pie-legend-item';
      item.innerHTML = `<span class="pie-legend-swatch" style="background:${s.color};"></span> ${s.label} <b>${Math.round(frac * 100)}%</b>`;
      legend.appendChild(item);
    });

    if (!slices.length) {
      group.innerHTML = `<circle cx="50" cy="50" r="38" fill="none" stroke="var(--track-fill)" stroke-width="18"/>`;
    }
  }

  // Bubble Scatter Chart — temp vs humidity, sized by wind
  function renderBubbleChart(data) {
    const canvas = document.getElementById('bubbleChartCanvas');
    if (!canvas || !data || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 30, bottom: 44, left: 48 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const accent = cssVar('--accent-primary', '#10b981');
    const accentLight = cssVar('--accent-light', '#34d399');
    const grid = cssVar('--chart-grid', 'rgba(255,255,255,0.08)');
    const axis = cssVar('--chart-axis', '#64748b');
    const muted = cssVar('--text-muted', '#94a3b8');

    const temps = data.map(c => c.weather.current?.temperature_2m || 0);
    const hums = data.map(c => c.weather.current?.relative_humidity_2m || 0);
    const winds = data.map(c => c.weather.current?.wind_speed_10m || 0);

    const minT = Math.min(...temps) - 3;
    const maxT = Math.max(...temps) + 3;
    const minH = Math.max(0, Math.min(...hums) - 10);
    const maxH = Math.min(100, Math.max(...hums) + 10);
    const maxWind = Math.max(...winds, 1);

    function xOf(t) { return pad.left + ((t - minT) / (maxT - minT)) * plotW; }
    function yOf(h) { return pad.top + plotH - ((h - minH) / (maxH - minH)) * plotH; }
    function rOf(w) { return 10 + (w / maxWind) * 22; }

    ctx.clearRect(0, 0, w, h);

    // Grid + labels
    ctx.font = '10px Inter, sans-serif';
    ctx.strokeStyle = grid;
    ctx.fillStyle = axis;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText(Math.round(maxH - ((maxH - minH) / 4) * i), pad.left - 6, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) {
      const x = pad.left + (plotW / 4) * i;
      ctx.fillText(Math.round(minT + ((maxT - minT) / 4) * i), x, pad.top + plotH + 8);
    }

    // Axis titles
    ctx.fillStyle = muted;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Temperature (${State.units === 'imperial' ? '°F' : '°C'})`, pad.left + plotW / 2, h - 14);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Humidity (%)', 0, 0);
    ctx.restore();

    // Bubbles
    data.forEach((c, i) => {
      const t = c.weather.current?.temperature_2m || 0;
      const hum = c.weather.current?.relative_humidity_2m || 0;
      const wind = c.weather.current?.wind_speed_10m || 0;
      const x = xOf(t);
      const y = yOf(hum);
      const r = rOf(wind);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = accentRgba(0.28);
      ctx.fill();
      ctx.strokeStyle = c.isCurrent ? accent : accentLight;
      ctx.lineWidth = c.isCurrent ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = cssVar('--text-main', '#f1f5f9');
      ctx.font = `${c.isCurrent ? '600 ' : ''}10px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.name, x, y);
    });
  }

  // Stacked Bar Chart — 48-hour pollutant composition
  function renderStackedBarChart(airQuality) {
    const canvas = document.getElementById('stackedBarCanvas');
    if (!canvas || !airQuality || !airQuality.hourly) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 14, right: 14, bottom: 26, left: 40 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const n = Math.min(48, airQuality.hourly.time?.length || 0);
    if (!n) return;

    const groups = ['pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', 'sulphur_dioxide'];
    const colors = ['#ef4444', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981'];
    // Carbon monoxide is in much larger units; fold it into the last band
    const co = airQuality.hourly.carbon_monoxide || [];

    const series = groups.map(g => (airQuality.hourly[g] || []).slice(0, n));
    const coSlice = co.slice(0, n);

    // Compute stacked totals using each series max for scaling
    const totals = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      groups.forEach((g, gi) => { s += (series[gi][i] || 0); });
      s += (coSlice[i] || 0) / 1000; // scale CO down for visibility
      totals[i] = s;
    }
    const maxTotal = Math.max(...totals, 1);

    const grid = cssVar('--chart-grid', 'rgba(255,255,255,0.08)');
    const axis = cssVar('--chart-axis', '#64748b');
    ctx.clearRect(0, 0, w, h);

    ctx.font = '10px Inter, sans-serif';
    ctx.strokeStyle = grid;
    ctx.fillStyle = axis;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (plotH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText((maxTotal - (maxTotal / 3) * i).toFixed(0), pad.left - 6, y);
    }

    const bandW = plotW / n;
    for (let i = 0; i < n; i++) {
      let cum = 0;
      groups.forEach((g, gi) => {
        const v = (series[gi][i] || 0);
        if (v <= 0) return;
        const bh = (v / maxTotal) * plotH;
        const y = pad.top + plotH - cum - bh;
        ctx.fillStyle = colors[gi];
        ctx.fillRect(pad.left + i * bandW + 0.5, y, Math.max(1, bandW - 1), bh);
        cum += bh;
      });
      // CO band (scaled)
      const coV = (coSlice[i] || 0) / 1000;
      if (coV > 0) {
        const bh = (coV / maxTotal) * plotH;
        const y = pad.top + plotH - cum - bh;
        ctx.fillStyle = colors[4];
        ctx.fillRect(pad.left + i * bandW + 0.5, y, Math.max(1, bandW - 1), bh);
      }
    }

    // X labels every 8 hours
    ctx.fillStyle = axis;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < n; i += 8) {
      const d = new Date(airQuality.hourly.time[i]);
      ctx.fillText(d.toLocaleTimeString([], { hour: 'numeric', hour12: true }), pad.left + i * bandW + bandW / 2, pad.top + plotH + 8);
    }
  }

  // ==========================================
  // INTERACTIVE MAP
  // ==========================================
  function formatCoordPair(lat, lon) {
    return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  }

  function initMap() {
    if (State.map) return;
    const mapEl = document.getElementById('worldMap');
    if (!mapEl || typeof maplibregl === 'undefined') return;

    // OpenFreeMap vector style — dark/light, no watermark, no API key
    const isDark = document.documentElement.classList.contains('theme-light') === false;
    State.map = new maplibregl.Map({
      container: 'worldMap',
      style: isDark ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/bright',
      center: [State.location.longitude, State.location.latitude],
      zoom: 4,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false
    });

    State.map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    State.map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: State.units === 'imperial' ? 'imperial' : 'metric' }), 'bottom-left');

    // Swap map basemap when the theme changes
    State.mapThemeWatcher = function () {
      const nowDark = document.documentElement.classList.contains('theme-light') === false;
      if (State.map && State._mapDark !== nowDark) {
        State._mapDark = nowDark;
        const center = State.map.getCenter();
        const zoom = State.map.getZoom();
        State.map.setStyle(nowDark ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/bright');
        State.map.once('style.load', function () {
          State.map.jumpTo({ center: center, zoom: zoom });
          applyMapMarkerTheme();
        });
      }
    };

    // Custom Glowing Emerald Pin
    const pinEl = document.createElement('div');
    pinEl.className = 'custom-map-pin';
    pinEl.innerHTML = '<div class="custom-map-pin-pulse"></div><div class="custom-map-pin-inner"></div>';

    State.mapMarker = new maplibregl.Marker({ element: pinEl, anchor: 'center' })
      .setLngLat([State.location.longitude, State.location.latitude])
      .addTo(State.map);

    // Map Click Listener
    State.map.on('click', async function (e) {
      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;

      // Update marker position immediately
      State.mapMarker.setLngLat([lon, lat]);
      document.getElementById('mapActiveCoordText').textContent = formatCoordPair(lat, lon);

      // Update floating card loading state
      const card = document.getElementById('mapFloatingCard');
      card.style.display = 'flex';
      document.getElementById('mapCardCity').textContent = 'Querying telemetry...';
      document.getElementById('mapCardCoords').textContent = formatCoordPair(lat, lon);
      document.getElementById('mapCardTemp').textContent = '--';

      try {
        // Reverse geocode
        const place = await ApiClient.reverseGeocode(lat, lon);
        const weather = await ApiClient.fetchWeather(lat, lon, State.units);

        const cityName = place.name || `Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°`;
        const temp = Math.round(weather.current?.temperature_2m ?? 0);
        const code = weather.current?.weather_code ?? 0;
        const condition = WeatherCodeMap[code]?.label || 'Clear';
        const wind = Math.round(weather.current?.wind_speed_10m ?? 0);
        const humidity = Math.round(weather.current?.relative_humidity_2m ?? 0);
        const pressure = Math.round(weather.current?.surface_pressure ?? 1013);
        const u = State.units === 'imperial' ? '°F' : '°C';
        const sUnit = State.units === 'imperial' ? 'mph' : 'km/h';

        document.getElementById('mapCardCity').textContent = cityName;
        document.getElementById('mapCardCoords').textContent = formatCoordPair(lat, lon);
        document.getElementById('mapCardTemp').textContent = temp;
        document.getElementById('mapCardTempUnit').textContent = u;
        document.getElementById('mapCardCondition').textContent = condition;
        document.getElementById('mapCardWind').textContent = `${wind} ${sUnit}`;
        document.getElementById('mapCardHumidity').textContent = `${humidity}%`;
        document.getElementById('mapCardPressure').textContent = `${pressure} hPa`;
        document.getElementById('mapCardAqi').textContent = 'Nominal';

        // Store candidate location for "Focus Location" button
        State.mapCardData = {
          name: cityName,
          country: place.country || '',
          latitude: lat,
          longitude: lon,
          timezone: weather.timezone || 'UTC'
        };
      } catch (err) {
        document.getElementById('mapCardCity').textContent = 'Location telemetry error';
      }

      // Recolor marker after fresh telemetry
      applyMapMarkerTheme();
    });

    // Button to set clicked location as active
    document.getElementById('mapSetLocationBtn').addEventListener('click', function () {
      if (State.mapCardData) {
        selectLocation(State.mapCardData);
        switchView('overview');
        showToast(`Loaded ${State.mapCardData.name} into Analytics`);
      }
    });
  }

  function updateMapPosition(lat, lon) {
    if (!State.map) return;
    State.map.jumpTo({ center: [lon, lat], zoom: 7 });
    if (State.mapMarker) {
      State.mapMarker.setLngLat([lon, lat]);
    }
    document.getElementById('mapActiveCoordText').textContent = formatCoordPair(lat, lon);
    // Also update floating card
    document.getElementById('mapCardCity').textContent = State.location.name;
    document.getElementById('mapCardCoords').textContent = formatCoordPair(lat, lon);
  }

  // Keep the map marker color consistent with the active accent + theme
  function applyMapMarkerTheme() {
    if (!State.mapMarker) return;
    const isLight = document.documentElement.classList.contains('theme-light');
    const accent = (AccentThemes[State.accent] || AccentThemes.emerald).primary;
    const border = isLight ? '#0f172a' : '#ffffff';
    const el = State.mapMarker.getElement();
    const inner = el.querySelector('.custom-map-pin-inner');
    const pulse = el.querySelector('.custom-map-pin-pulse');
    if (inner) {
      inner.style.background = accent;
      inner.style.border = `2px solid ${border}`;
      inner.style.boxShadow = `0 0 10px ${accent}`;
    }
    if (pulse) pulse.style.background = `${accent}66`;
    document.getElementById('mapCardAqi').style.color = accent;
  }

  // ==========================================
  // VIEW ROUTER & TABS
  // ==========================================
  function switchView(viewName) {
    State.activeView = viewName;

    // Sync both the desktop tab row and the mobile bottom tab bar
    document.querySelectorAll('.view-tab, .bottom-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });
    document.querySelectorAll('.dashboard-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // On mobile, scroll back to the top when switching views
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Resize map if switching to map
    if (viewName === 'map') {
      setTimeout(() => {
        if (!State.map) initMap();
        else State.map.resize();
      }, 100);
    }

    // Re-render canvases for the view being shown
    if (viewName === 'overview' && State.weatherData) {
      setTimeout(() => {
        renderHourlyChart(State.weatherData.hourly);
        renderComfortGauge(State.weatherData.hourly, State.weatherData.current);
        renderWaffleChart(State.weatherData.hourly);
      }, 50);
    }
    if (viewName === 'analytics' && State.weatherData) {
      setTimeout(() => {
        renderMultiMetricChart(State.weatherData.hourly);
        renderWindRose(State.weatherData.hourly);
        renderPrecipBars(State.weatherData.hourly);
        renderPressureTrend(State.weatherData.hourly);
        renderRadarChart(State.weatherData.hourly);
        renderPieChart(State.weatherData.hourly);
      }, 50);
    }
    if (viewName === 'airquality' && State.airQualityData) {
      setTimeout(() => renderStackedBarChart(State.airQualityData), 50);
    }
    if (viewName === 'comparisons') {
      loadComparison();
    }

    StorageManager.save();
  }

  // ==========================================
  // DATA SYNC & CONTROLLER
  // ==========================================
  async function loadTelemetry() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    try {
      const [weather, airQuality] = await Promise.all([
        ApiClient.fetchWeather(State.location.latitude, State.location.longitude, State.units),
        ApiClient.fetchAirQuality(State.location.latitude, State.location.longitude)
      ]);

      State.weatherData = weather;
      State.airQualityData = airQuality;

      // Render all views
      renderHero(weather, airQuality);
      renderOverviewMetrics(weather, airQuality);
      renderHourlyChart(weather.hourly);
      renderMultiMetricChart(weather.hourly);
      renderWindRose(weather.hourly);
      renderPrecipBars(weather.hourly);
      renderPressureTrend(weather.hourly);
      renderAirQualityView(airQuality);
      renderAqiTrend(airQuality);
      render14DayTable(weather.daily);
      renderRadarChart(weather.hourly);
      renderStackedBarChart(airQuality);
      updateMapPosition(State.location.latitude, State.location.longitude);

      document.getElementById('footerLastSync').textContent = new Date().toLocaleTimeString();
      refreshSettingsMeta();

      // Record into recently viewed
      const exists = State.recentlyViewed.some(l => l.name === State.location.name);
      if (!exists) {
        State.recentlyViewed.unshift({ ...State.location });
      }
      StorageManager.save();
    } catch (err) {
      console.error('Failed to load telemetry:', err);
      showToast(`Telemetry fetch error: ${err.message}`, 'error');
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('spinning');
    }
  }

  function selectLocation(loc) {
    State.location = { ...loc };
    // Highlight quick city chips if matching
    document.querySelectorAll('.city-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.name === loc.name);
    });
    loadTelemetry();
  }

  // ==========================================
  // EVENT LISTENERS & SETUP
  // ==========================================
  function setupEventListeners() {
    // Navigation Tabs (desktop tab row + mobile bottom nav)
    document.querySelectorAll('.view-tab, .bottom-tab').forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Unit Toggle
    document.getElementById('unitToggle').addEventListener('click', (e) => {
      const btn = e.target.closest('.unit-btn');
      if (!btn || btn.dataset.unit === State.units) return;
      State.units = btn.dataset.unit;
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b === btn));
      loadTelemetry();
      showToast(`Display units set to ${State.units === 'imperial' ? 'Imperial (°F)' : 'Metric (°C)'}`);
    });

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      loadTelemetry();
      showToast('Synchronizing meteorological feeds...');
    });

    // Quick City Chips
    document.getElementById('quickCitiesBar').addEventListener('click', (e) => {
      const chip = e.target.closest('.city-chip');
      if (!chip) return;
      selectLocation({
        name: chip.dataset.name,
        country: chip.dataset.country,
        latitude: parseFloat(chip.dataset.lat),
        longitude: parseFloat(chip.dataset.lon)
      });
    });

    // Hourly Chart Layer buttons
    document.querySelectorAll('.chart-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.chartLayer = btn.dataset.chartLayer;
        if (State.weatherData?.hourly) {
          renderHourlyChart(State.weatherData.hourly);
        }
      });
    });

    // Search Input with Debounced Autocomplete
    const searchInput = document.getElementById('citySearchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchClearBtn = document.getElementById('searchClearBtn');
    let searchTimeout = null;

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      searchClearBtn.style.display = query ? 'block' : 'none';

      if (searchTimeout) clearTimeout(searchTimeout);
      if (query.length < 2) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(async () => {
        const results = await ApiClient.searchLocations(query);
        if (!results || results.length === 0) {
          searchDropdown.innerHTML = `<div style="padding:12px;font-size:12px;color:#64748b;text-align:center;">No matching locations found</div>`;
          searchDropdown.classList.add('active');
          return;
        }

        searchDropdown.innerHTML = results.map((item, idx) => `
          <div class="dropdown-item" data-idx="${idx}">
            <div>
              <div class="dropdown-city">${item.name}</div>
              <div class="dropdown-country">${item.admin1 ? item.admin1 + ', ' : ''}${item.country || ''}</div>
            </div>
            <div class="dropdown-coords">${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°</div>
          </div>
        `).join('');

        searchDropdown.classList.add('active');

        // Attach click handlers to dropdown items
        searchDropdown.querySelectorAll('.dropdown-item').forEach(itemEl => {
          itemEl.addEventListener('click', () => {
            const idx = parseInt(itemEl.dataset.idx, 10);
            const chosen = results[idx];
            if (chosen) {
              selectLocation({
                name: chosen.name,
                country: chosen.country || '',
                latitude: chosen.latitude,
                longitude: chosen.longitude,
                timezone: chosen.timezone || 'UTC'
              });
              searchInput.value = '';
              searchClearBtn.style.display = 'none';
              searchDropdown.classList.remove('active');
              showToast(`Focused on ${chosen.name}, ${chosen.country || ''}`);
            }
          });
        });
      }, 250);
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      searchDropdown.classList.remove('active');
      searchInput.focus();
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        searchDropdown.classList.remove('active');
      }
    });

    // ---- Settings: theme mode ----
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.theme === State.theme) return;
        State.theme = btn.dataset.theme;
        applyAppearance();
        showToast(`Theme switched to ${State.theme === 'light' ? 'Light' : 'Dark'} mode`);
      });
    });

    // ---- Settings: accent color ----
    document.querySelectorAll('.accent-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        if (sw.dataset.accent === State.accent) return;
        State.accent = sw.dataset.accent;
        applyAppearance();
        showToast(`Accent color changed to ${sw.dataset.accent}`);
      });
    });

    // ---- Settings: density ----
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.density === State.density) return;
        State.density = btn.dataset.density;
        applyAppearance();
        showToast(`Layout density set to ${State.density}`);
        // Resize canvases now that padding changed
        setTimeout(() => {
          if (State.weatherData?.hourly) {
            renderHourlyChart(State.weatherData.hourly);
            renderMultiMetricChart(State.weatherData.hourly);
            renderWindRose(State.weatherData.hourly);
            renderPrecipBars(State.weatherData.hourly);
            renderPressureTrend(State.weatherData.hourly);
          }
          if (State.airQualityData) renderAqiTrend(State.airQualityData);
          if (State.comparisonData) renderComparison(State.comparisonData);
        }, 50);
      });
    });

    // ---- Settings: units toggle ----
    const settingsToggleUnits = document.getElementById('settingsToggleUnits');
    if (settingsToggleUnits) {
      settingsToggleUnits.addEventListener('click', () => {
        const btn = document.getElementById('unitToggle');
        if (btn) btn.click();
      });
    }

    // ---- Settings: clear recently viewed ----
    const settingsClearRecent = document.getElementById('settingsClearRecent');
    if (settingsClearRecent) {
      settingsClearRecent.addEventListener('click', () => {
        State.recentlyViewed = [];
        refreshSettingsMeta();
        showToast('Recently viewed locations cleared');
      });
    }

    // ---- Settings: reset appearance ----
    const settingsReset = document.getElementById('settingsResetAppearance');
    if (settingsReset) {
      settingsReset.addEventListener('click', () => {
        State.theme = 'dark';
        State.accent = 'emerald';
        State.density = 'comfortable';
        applyAppearance();
        showToast('Appearance reset to defaults');
      });
    }

    // Window resize handler for canvas charts
    window.addEventListener('resize', () => {
      if (State.weatherData?.hourly) {
        renderHourlyChart(State.weatherData.hourly);
        renderMultiMetricChart(State.weatherData.hourly);
        renderWindRose(State.weatherData.hourly);
        renderPrecipBars(State.weatherData.hourly);
        renderPressureTrend(State.weatherData.hourly);
        renderRadarChart(State.weatherData.hourly);
        renderPieChart(State.weatherData.hourly);
      }
      if (State.weatherData) {
        renderComfortGauge(State.weatherData.hourly, State.weatherData.current);
        renderWaffleChart(State.weatherData.hourly);
      }
      if (State.airQualityData) {
        renderAqiTrend(State.airQualityData);
        renderStackedBarChart(State.airQualityData);
      }
      if (State.comparisonData) {
        renderComparison(State.comparisonData);
        renderBubbleChart(State.comparisonData);
      }
      if (State.map) {
        State.map.resize();
      }
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  async function init() {
    setupEventListeners();

    // Detect whether a backend is available. On static hosts (GitHub Pages,
    // Netlify) there is none, so the app runs fully client-side.
    await StaticMode.detect();
    if (StaticMode.enabled) {
      document.documentElement.classList.add('static-mode');
      const badge = document.getElementById('storageSyncBadge');
      if (badge) badge.textContent = 'localStorage Client Sync (Static Mode)';
    }

    await StorageManager.loadPreferences();
    await loadTelemetry();

    // Auto-refresh every 5 minutes
    setInterval(loadTelemetry, 5 * 60 * 1000);
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
