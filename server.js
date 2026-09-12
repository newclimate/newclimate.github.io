/**
 * Weather & Climate Analytics Dashboard Server
 * Production Express Backend serving on port 80 (with fallback for unprivileged environments)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 80;
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, {
  index: false,
  maxAge: '1h'
}));

// In-memory cache for API requests to avoid rate limits and reduce upstream latency
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttlMs = CACHE_TTL_MS) {
  // Prevent unbounded cache growth
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

// Resilient upstream fetch with timeout
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WeatherClimateAnalytics/1.0'
      }
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Upstream API responded with status ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Upstream API request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// ---------------- API ROUTES ---------------- //

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Weather & Climate Analytics Backend'
  });
});

// Read data.json (temporary client-side browser storage sync)
app.get('/api/data-json', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return res.status(404).json({ error: 'data.json file not found' });
    }
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    console.error('Error reading data.json:', err.message);
    res.status(500).json({ error: 'Failed to read data.json', message: err.message });
  }
});

// Update data.json (preferences, recently viewed locations, cached responses)
app.post('/api/data-json', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload: must be an object' });
    }

    let existing = {};
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        existing = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
      } catch (_) {
        existing = {};
      }
    }

    const merged = {
      ...existing,
      ...payload,
      preferences: {
        ...(existing.preferences || {}),
        ...(payload.preferences || {})
      },
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    res.json({ success: true, message: 'data.json updated successfully' });
  } catch (err) {
    console.error('Error writing to data.json:', err.message);
    res.status(500).json({ error: 'Failed to update data.json', message: err.message });
  }
});

// Weather API proxy (Open-Meteo)
app.get('/api/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const units = req.query.units === 'imperial' ? 'imperial' : 'metric';

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, Longitude between -180 and 180'
      });
    }

    const cacheKey = `weather_${lat.toFixed(4)}_${lon.toFixed(4)}_${units}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, _fromCache: true });
    }

    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnit = units === 'imperial' ? 'mph' : 'kmh';
    const precipUnit = units === 'imperial' ? 'inch' : 'mm';

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
      `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto&forecast_days=14`;

    const data = await fetchWithTimeout(openMeteoUrl, 9000);
    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(502).json({
      error: 'Weather service temporarily unavailable',
      message: err.message
    });
  }
});

// Air Quality API proxy (Open-Meteo Air Quality)
app.get('/api/air-quality', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const cacheKey = `air_quality_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, _fromCache: true });
    }

    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index` +
      `&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi` +
      `&timezone=auto&forecast_days=3`;

    const data = await fetchWithTimeout(aqiUrl, 9000);
    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Air Quality API error:', err.message);
    res.status(502).json({
      error: 'Air quality service temporarily unavailable',
      message: err.message
    });
  }
});

// Geocoding Search API proxy (Open-Meteo Geocoding)
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toString().trim();
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const data = await fetchWithTimeout(searchUrl, 7000);

    const results = data.results || [];
    setCache(cacheKey, { results }, 30 * 60 * 1000); // 30 min cache for searches
    res.json({ results });
  } catch (err) {
    console.error('Search API error:', err.message);
    res.status(502).json({
      error: 'Location search failed',
      message: err.message,
      results: []
    });
  }
});

// Reverse Geocoding API (get city name from coordinates)
app.get('/api/reverse', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const cacheKey = `reverse_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Use BigDataCloud free client reverse geocoding
    const reverseUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await fetchWithTimeout(reverseUrl, 6000);

    const result = {
      name: data.locality || data.city || data.principalSubdivision || 'Target Location',
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      latitude: lat,
      longitude: lon,
      region: data.principalSubdivision || ''
    };

    setCache(cacheKey, result, 60 * 60 * 1000); // 1 hour
    res.json(result);
  } catch (err) {
    // Graceful fallback to coordinate name
    const fallback = {
      name: `Lat ${parseFloat(req.query.lat).toFixed(2)}°, Lon ${parseFloat(req.query.lon).toFixed(2)}°`,
      country: 'Global Coordinate',
      latitude: parseFloat(req.query.lat),
      longitude: parseFloat(req.query.lon)
    };
    res.json(fallback);
  }
});

// Climate History & Normals API proxy
app.get('/api/climate', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const cacheKey = `climate_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch 14-day climate baseline model from Open-Meteo
    const climateUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,shortwave_radiation_sum&past_days=14&forecast_days=14&timezone=auto`;
    const data = await fetchWithTimeout(climateUrl, 8000);

    setCache(cacheKey, data, 30 * 60 * 1000);
    res.json(data);
  } catch (err) {
    console.error('Climate API error:', err.message);
    res.status(502).json({ error: 'Climate data unavailable', message: err.message });
  }
});

// Main dashboard entry point
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all handler to serve index.html for client-side routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global process safety
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in server:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Express server on PORT 80 (with fallback for unprivileged environments)
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`=======================================================`);
    console.log(`  Weather & Climate Analytics Server Online`);
    console.log(`  Port: http://localhost:${portToTry}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EACCES' && portToTry === 80) {
      console.warn(`[Port 80 requires root privileges. Binding fallback port 3000...]`);
      startServer(3000);
    } else {
      console.error('Server failed to start:', err);
    }
  });

  return server;
}

startServer(DEFAULT_PORT);

module.exports = app;
