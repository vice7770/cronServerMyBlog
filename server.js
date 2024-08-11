import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import cron from 'node-cron';
import initializeDb from "./api/services/weather.js";
import upsertWeatherData from "./api/services/queryWeather.js";
import moveYesterdayData from "./api/services/moveYesterdayData.js";
import pg from 'pg'
import { topVisitedCitiesInEurope } from "./const.js";
import { fetchWeatherApi } from 'openmeteo';

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

let params = {
	// "latitude": [38.7167, 48.8534],
	// "longitude": [-9.1333, 2.3488],
    "latitude": [],
    "longitude": [],
	"current": ["relative_humidity_2m", "rain", "cloud_cover"],
	"daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "sunrise", "sunset", "daylight_duration", "uv_index_max", "precipitation_sum", "wind_speed_10m_max"],
	"past_days": 1,
	"forecast_days": 1
};

const generateTargetReports = async () => {
    function getWeatherData(countryName, response) {
        const range = (start, stop, step) =>
            Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        // const timezone = response.timezone(); 
        // const timezoneAbbreviation = response.timezoneAbbreviation();
        // const latitude = response.latitude();
        // const longitude = response.longitude();
        const current = response.current();
        const daily = response.daily();

        // Note: The order of weather variables in the URL query and the indices below need to match
        const weatherData = {
            current: {
                time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                relativeHumidity2m: current.variables(0).value(),
                rain: current.variables(1).value(),
                cloudCover: current.variables(2).value(),
            },
            daily: {
                time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                    (t) => new Date((t + utcOffsetSeconds) * 1000)
                ),
                temperature2mMax: daily.variables(0).valuesArray(),
                temperature2mMin: daily.variables(1).valuesArray(),
                sunrise: daily.variables(2).valuesArray(),
                sunset: daily.variables(3).valuesArray(),
                daylightDuration: daily.variables(4).valuesArray(),
                uvIndexMax: daily.variables(5).valuesArray(),
                precipitationSum: daily.variables(6).valuesArray(),
                windSpeed10mMax: daily.variables(7).valuesArray(),
                weatherCode: daily.variables(8).valuesArray(),
            },
        };
        // console.log(weatherData);
        // console.log(countryName, weatherData);
        return {name: countryName,metaData: weatherData};
    }

    async function fetchCountry(params){
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);
        // Helper function to form time ranges
        // if (!responses.ok) {
        //     throw new Error('Failed to fetch data from API');
        // }
        const weatherData = responses.map((response, index) => getWeatherData(topVisitedCitiesInEurope[index].name,response));
        return weatherData;
    }

    try {
        // // Fetch data from API
        console.log('Saving data to database...');
        // console.log(data);
        const latitude = topVisitedCitiesInEurope.map((city) => city.coordinates.lat);
        const longitude = topVisitedCitiesInEurope.map((city) => city.coordinates.lon);
        const params_ = {...params, latitude: latitude, longitude: longitude};
        const weather = await fetchCountry(params_);
        // console.log(weather);
        // moveYesterdayData(pool);
        // const promisesResult = Promise.allSettled(topVisitedCitiesInEurope.map((country) =>{ 
        //     const randomTemp = Math.floor(Math.random() * 51) + 50;
        //     const data_ = {...data, name: country, main: {...data.main, temp: randomTemp}};
        //     console.log(randomTemp, data_);
        //     upsertWeatherData(pool, data_)
        // }));
        weather.map((city) => upsertWeatherData(pool, city))
        // if((await promisesResult).find((promise) => promise.status === 'rejected')) {
        //     throw new Error('Failed to save data to database');
        // }
    } catch (apiError) {
        throw new Error(`Failed to call scheduler endpoint:` + apiError);
    }
    console.log('Generating target reports...');
}

// Scheduler
const runScheduler = async () => {
    generateTargetReports();
    cron.schedule('0 5 * * *', generateTargetReports);
};

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  runScheduler();
});