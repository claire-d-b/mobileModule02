import { fetchWeatherApi } from "openmeteo";

interface EnsembleParams {
  latitude: number;
  longitude: number;
  daily: string[];
  hourly: string[];
  current: string[];
}

export const getForecasts = async ({ ...params }: EnsembleParams) => {
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];

  // utcOffsetSeconds() is a method returned by the open-meteo API which gives the time difference in secondes between UTC and the local time zone from the city.
  const utcOffsetSeconds = response.utcOffsetSeconds();

  const current = response.current()!;
  const hourly = response.hourly()!;
  const daily = response.daily()!;

  // Note: The order of weather variables in the URL query and the indices below need to match!
  // current.time() returns a BigInt (ex: 1718617200n) — number of seconds from the 1st Jan 1970 in UTC. Number() converts it into classical number.
  // JavaScript deals with milliseconds, not seconds — so we multiply by 1000.
  // Without utcOffsetSeconds, the date would be correct in absolute value but when you call time.getDate() or time.getHours(), JavaScript would rely on the mobile's time zone, which can lead to a different day for a city far from the user.
  const weatherData = {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature_2m: current.variables(0)!.value(),
      weather_code: current.variables(1)!.value(),
      wind_speed_10m: current.variables(2)!.value(),
    },
    hourly: {
      time: Array.from(
        {
          length:
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
            hourly.interval(),
        },
        (_, i) =>
          new Date(
            (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
              1000,
          ),
      ),
      temperature_2m: hourly.variables(0)!.valuesArray(),
      weather_code: hourly.variables(1)!.valuesArray(),
      wind_speed_10m: hourly.variables(2)!.valuesArray(),
    },
    daily: {
      time: Array.from(
        {
          length:
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
        },
        (_, i) =>
          new Date(
            (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
              1000,
          ),
      ),
      weather_code: daily.variables(0)!.valuesArray(),
      temperature_2m_max: daily.variables(1)!.valuesArray(),
      temperature_2m_min: daily.variables(2)!.valuesArray(),
      wind_speed_10m_max: daily.variables(3)!.valuesArray(),
    },
  };

  return weatherData;
  // The 'weatherData' object now contains a simple structure, with arrays of datetimes and weather information
};
