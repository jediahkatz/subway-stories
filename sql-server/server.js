const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

// Enable CORS for all routes
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DATABASE_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Route 1: Ridership by Station
app.get('/ridership-by-station', (req, res) => {
  console.log('/ridership-by-station starts at', new Date().toISOString());
  const { selectedDay, selectedStation, selectedDirection, selectedMonths } = req.query;
  const complexId = selectedStation;
  const monthsArray = selectedMonths.split(',');
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
    console.log('/ridership-by-station query done at', new Date().toISOString());
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        message: 'success',
        data: rows,
      });
    }
  });
});

// Route 2: Total Ridership
app.get('/total-ridership', (req, res) => {
  console.log('/total-ridership starts at', new Date().toISOString());

  const { selectedDay, selectedMonths, selectedDirection } = req.query;
  const monthsArray = selectedMonths.split(',');
  const numMonthsToAverageOver = monthsArray.length;
  const shouldSelectDestinations = selectedDirection === 'goingTo';

  const sqlQuery = `
    SELECT complex_id as station_id, hour_of_day as hour, total_ridership / ? as total_ridership 
    FROM precomputed_total_ridership 
    WHERE day_of_week = ?
      AND is_destination = ?
      AND month IN (${monthsArray.map(() => '?').join(',')})
  `;
  
  db.all(sqlQuery, [numMonthsToAverageOver, selectedDay, shouldSelectDestinations, ...monthsArray], (err, rows) => {
    console.log('SQL Query done at', new Date().toISOString());
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const stationIdToTotalRidershipByHour = {};
      rows.forEach(row => {
        if (!stationIdToTotalRidershipByHour[row.station_id]) {
          stationIdToTotalRidershipByHour[row.station_id] = {};
        }
        stationIdToTotalRidershipByHour[row.station_id][row.hour] = row.total_ridership;
      });
      res.json({
        message: 'success',
        data: stationIdToTotalRidershipByHour
      });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
