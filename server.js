import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import cron from 'node-cron';
import initializeDb from "./api/services/weather.js";
import upsertWeatherData from "./api/services/queryWeather.js";
import pg from 'pg'
import { topVisitedCitiesInEurope } from "./const.js";

// No need to edit any of this code

const app = express();
const server = http.Server(app);
const { Pool } = pg;
// Connect to PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

initializeDb(pool)

app.use(cors({ credentials: false, origin: "*" }));
app.use(express.json());

const staticPath = path.resolve("public/");
app.use(express.static(staticPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(staticPath, "index.html"));
});

// app.get('/api/services/scheduler', async (req, res) => {
//     const result = GET();
//     res.send('Target reports sent successfully');
// });

const data = {
    coord: { lon: -9.1333, lat: 38.7167 },
    weather: [
      { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }
    ],
    base: 'stations',
    main: {
      temp: 71.24,
      feels_like: 71.73,
      temp_min: 68.56,
      temp_max: 73.13,
      pressure: 1014,
      humidity: 78,
      sea_level: 1014,
      grnd_level: 1006
    },
    visibility: 10000,
    wind: { speed: 11.01, deg: 351, gust: 15.99 },
    clouds: { all: 20 },
    dt: 1722367014,
    sys: {
      type: 1,
      id: 6897,
      country: 'PT',
      sunrise: 1722317780,
      sunset: 1722368963
    },
    timezone: 3600,
    id: 2267057,
    name: 'Lisbon',
    cod: 200
}

const generateTargetReports = async () => {
    try {
        // // Fetch data from API
        // const response = await fetch('https://open-weather13.p.rapidapi.com/city/Lisbon/EN', {
        //     method: 'GET',
        //     headers: {
        //         'x-rapidapi-host': process.env.RAPID_APIHOST,
        //         'x-rapidapi-key': process.env.RAPID_APIKEY
        //     }
        // });
        // if (!response.ok) {
        //     throw new Error('Failed to fetch data from API');
        // }
        // const data = await response.json();
        // // Save data to database
        console.log('Saving data to database...');
        console.log(data);
        const promisesResult = Promise.allSettled(topVisitedCitiesInEurope.map((country) =>{ 
            const data_ = {...data, name: country}
            upsertWeatherData(pool, data_)
        }))
        if((await promisesResult).find((promise) => promise.status === 'rejected')) {
            throw new Error('Failed to save data to database');
        }
    } catch (apiError) {
        throw new Error(`Failed to call scheduler endpoint: ${apiError}`);
    }
    console.log('Generating target reports...');
}

// Scheduler
const runScheduler = async () => {
    console.log('Starting scheduler...', process.env.RAPID_APIHOST);
    generateTargetReports();
    cron.schedule('0 5 * * *', generateTargetReports);
};

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  runScheduler();
});