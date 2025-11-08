const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const { Mutex } = require('./lib');
const { checkIpBan } = require('./antiabuse');
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

// Enable CORS for the Subway Stories website
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Add IP ban middleware
app.use(checkIpBan);

// Add IP logging middleware
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const cleanIp = clientIp.replace(/^::ffff:/, ''); // Remove IPv6 prefix if present
  console.log(`[${new Date().toISOString()}] Request from IP: ${cleanIp}, Path: ${req.path}, Method: ${req.method}, Params: ${JSON.stringify(req.query)}`);
  next();
});

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DATABASE_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Calculate SQLite cache size based on available memory
    // Conservative: use 40% of total RAM for SQLite cache
    // This leaves 60% for Node.js, query results, temp tables, OS, and safety margin
    const os = require('os');
    const totalMemoryMB = os.totalmem() / (1024 * 1024);
    const cacheMemoryMB = Math.max(64, Math.floor(totalMemoryMB * 0.4));
    const cacheSizeKB = cacheMemoryMB * 1024;
    
    console.log(`Total memory: ${Math.floor(totalMemoryMB)}MB, SQLite cache: ${cacheMemoryMB}MB (40%)`);
    
    db.run(`PRAGMA cache_size = -${cacheSizeKB}`); // negative = KB
    db.run("PRAGMA temp_store = memory");
    // mmap_size: use 2x cache for virtual memory mapping (doesn't count against RAM limit)
    db.run(`PRAGMA mmap_size = ${cacheMemoryMB * 2 * 1024 * 1024}`);
  }
});

const MAX_MONTHS_ALLOWED = 12;

function parseSelectedMonths(selectedMonths) {
  if (!selectedMonths || typeof selectedMonths !== 'string') {
    throw new Error('selectedMonths query parameter is required');
  }

  const monthsArray = selectedMonths
    .split(',')
    .map(month => month.trim())
    .filter(Boolean);

  if (monthsArray.length === 0) {
    throw new Error('selectedMonths must include at least one month');
  }

  if (monthsArray.length > MAX_MONTHS_ALLOWED) {
    throw new Error(`selectedMonths cannot include more than ${MAX_MONTHS_ALLOWED} entries`);
  }

  const validatedMonths = monthsArray.map(month => {
    if (!/^\d{1,2}$/.test(month)) {
      throw new Error(`Invalid month value: ${month}`);
    }

    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) {
      throw new Error(`Month out of range (1-12): ${month}`);
    }

    return monthNumber;
  });

  return validatedMonths;
}

// Route 1: Ridership by Station
app.get('/ridership-by-station', (req, res) => {
  console.log('/ridership-by-station starts at', new Date().toISOString());
  const { selectedDay, selectedStation, selectedDirection, selectedMonths } = req.query;
  const complexId = selectedStation;
  let monthsArray;
  try {
    monthsArray = parseSelectedMonths(selectedMonths);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const numMonthsToAverageOver = monthsArray.length;

  const sqlQuery = `
    SELECT ${selectedDirection === 'goingTo' ? 'destination_complex_id' : 'origin_complex_id'} AS station_id,
           hour_of_day AS hour,
           SUM(estimated_avg_ridership) / ? AS ridership
    FROM subway_origin_destination_2023
    WHERE ${selectedDirection === 'goingTo' ? 'origin_complex_id' : 'destination_complex_id'} = ?
      AND day_of_week = ?
      AND month IN (${monthsArray.map(() => '?').join(',')})
    GROUP BY station_id, hour
  `;

  db.all(sqlQuery, [numMonthsToAverageOver, complexId, selectedDay, ...monthsArray], (err, rows) => {
    console.log('/ridership-by-station query done at', new Date().toISOString(), `(${rows ? rows.length : 0} rows)`);
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        message: 'success',
        data: rows,
      });
      console.log('/ridership-by-station complete at', new Date().toISOString());
    }
  });
});

// Route 2: Total Ridership
app.get('/total-ridership', (req, res) => {
  console.log('/total-ridership starts at', new Date().toISOString());

  const { selectedDay, selectedMonths, selectedDirection } = req.query;
  let monthsArray;
  try {
    monthsArray = parseSelectedMonths(selectedMonths);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const numMonthsToAverageOver = monthsArray.length;
  const shouldSelectDestinations = selectedDirection === 'goingTo';

  const sqlQuery = `
    SELECT complex_id as station_id, hour_of_day as hour, SUM(total_ridership) / ? as total_ridership
    FROM precomputed_total_ridership 
    WHERE day_of_week = ?
      AND is_destination = ?
      AND month IN (${monthsArray.map(() => '?').join(',')})
    GROUP BY station_id, hour
  `;
  
  db.all(sqlQuery, [numMonthsToAverageOver, selectedDay, shouldSelectDestinations, ...monthsArray], (err, rows) => {
    console.log('SQL Query done at', new Date().toISOString(), `(${rows ? rows.length : 0} rows)`);
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const transformStart = Date.now();
      const stationIdToTotalRidershipByHour = {};
      rows.forEach(row => {
        if (!stationIdToTotalRidershipByHour[row.station_id]) {
          stationIdToTotalRidershipByHour[row.station_id] = {};
        }
        stationIdToTotalRidershipByHour[row.station_id][row.hour] = row.total_ridership;
      });
      console.log(`Data transformation took ${Date.now() - transformStart}ms`);
      res.json({
        message: 'success',
        data: stationIdToTotalRidershipByHour
      });
      console.log('/total-ridership complete at', new Date().toISOString());
    }
  });
});

// Route 3: Tracking Mapbox Loads
const MAX_ALLOWED_LOADS_PER_MONTH = 48_000; // it's really 50k, but let's be conservative
const usageFileMutex = new Mutex();
app.post('/mapbox-load', async (req, res) => {
  const unlock = await usageFileMutex.lock();
  try {

    const countFilePath = process.env.MAPBOX_COUNT_PATH;
    let usageCounts = [];

    // Read existing counts or create a new array if file doesn't exist
    try {
      const data = await fs.readFile(countFilePath, 'utf8');
      usageCounts = JSON.parse(data);
    } catch (error) {
      // Log error but continue with blank usageCounts
      console.error(error);
    }

    // Remove entries older than past month
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    usageCounts = usageCounts.filter(entry => new Date(entry.date) >= oneMonthAgo);

    // Calculate total count for the month
    const totalCount = usageCounts.reduce((sum, entry) => sum + entry.count, 0);
    const shouldLoad = totalCount < MAX_ALLOWED_LOADS_PER_MONTH;

    // Update count for current day
    if (shouldLoad) {
      const today = usageCounts.find(entry => new Date(entry.date).toDateString() === now.toDateString());
      if (today) {
        today.count += 1;
      } else {
        usageCounts.push({ date: now.toISOString(), count: 1 });
      }
    }

    // Write updated counts back to file
    await fs.writeFile(countFilePath, JSON.stringify(usageCounts), 'utf8');

    res.json({ message: 'success', shouldLoad });
  } catch (error) {
    console.error('Error tracking Mapbox load:', error);
    res.status(500).json({ error: 'Failed to track Mapbox load' });
  } finally {
    unlock();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
