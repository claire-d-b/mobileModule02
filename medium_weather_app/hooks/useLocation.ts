import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import { getForecasts } from "./ensemble";
import { WeatherData } from "../app/CBottomNav";

interface Coords {
  latitude: number | undefined;
  longitude: number | undefined;
}

const requestPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

const checkGPSEnabled = async (): Promise<boolean> => {
  return await Location.hasServicesEnabledAsync();
};

const promptEnableGPS = (): void => {
  Alert.alert(
    "GPS Settings",
    "Please enable location services to detect your position.",
    [
      {
        text: "Open Settings",
        onPress: () => {
          if (Platform.OS === "android") {
            IntentLauncher.startActivityAsync(
              IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
            );
          } else {
            Location.enableNetworkProviderAsync();
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ],
  );
};

const getLocation = async (): Promise<Coords | null> => {
  const granted = await requestPermission();
  if (!granted) return null;

  const gpsOn = await checkGPSEnabled();
  if (!gpsOn) {
    promptEnableGPS();
    return null;
  }

  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch (e) {
    console.warn("Could not get position:", e);
    return null;
  }
};

export const trackLocation = async (
  onChange: (coords: Coords) => void,
): Promise<Location.LocationSubscription | null> => {
  const granted = await requestPermission();
  if (!granted) return null;

  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // 5s between each update
      distanceInterval: 10, // updates when the location has changed by at least this distance in meters
    },
    ({ coords }) =>
      onChange({ latitude: coords.latitude, longitude: coords.longitude }),
  );
};

export const getLocationName = async (
  coords: Coords,
): Promise<string | null> => {
  if (coords.latitude === undefined || coords.longitude === undefined)
    return null;
  // Reverse geocode a location to postal address.
  // On Android, you must request location permissions with requestForegroundPermissionsAsync before geocoding can be used.
  const [place] = await Location.reverseGeocodeAsync({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
  if (!place) return null;
  return [
    place.streetNumber,
    place.street,
    place.city,
    place.region,
    place.country,
  ]
    .filter(Boolean) // Delete all empty/null values from the array. Kepps only truthy values.
    .join(", ");
};

export const getPlacesList = async (location: string) => {
  if (!location) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=10&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results ?? [];
  } catch (e) {
    console.error("Places fetch failed:", e);
    return [];
  }
};

export const useLocation = (externalCoords?: {
  latitude: number;
  longitude: number;
}) => {
  const [address, setAddress] = useState<string>("");
  const [coords, setCoords] = useState<Coords>({
    latitude: undefined,
    longitude: undefined,
  });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const activeCoords = externalCoords ?? coords;

  // Fetch ensemble weather when coords change
  useEffect(() => {
    const fetchForecasts = async () => {
      if (
        activeCoords.latitude === undefined ||
        activeCoords.longitude === undefined
      )
        return;
      // params to send to openmeteo - defines which values will be returned
      const response = await getForecasts({
        latitude: activeCoords.latitude,
        longitude: activeCoords.longitude,
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "wind_speed_10m_max",
        ],
        hourly: ["temperature_2m", "weather_code", "wind_speed_10m"],
        current: ["temperature_2m", "weather_code", "wind_speed_10m"],
      });
      setWeatherData(response);
      // console.log("resp", response);
    };
    fetchForecasts();
  }, [activeCoords.latitude, activeCoords.longitude]);
  // Get location on mount and track changes
  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const init = async () => {
      const initialCoords = await getLocation();
      const currentCoords = {
        latitude: initialCoords?.latitude,
        longitude: initialCoords?.longitude,
      };
      setCoords(currentCoords);

      const name = await getLocationName(currentCoords);
      setAddress(name ?? "");
      setLoading(false);

      subscriber = await trackLocation(async (newCoords) => {
        if (externalCoords) return;
        setCoords(newCoords);
        const newAddress = await getLocationName(newCoords);
        setAddress(newAddress ?? "");
      });
    };

    init();
    // cleanup function of the useEffect — React calls it automatically when component is unmounted.
    return () => subscriber?.remove();
  }, []);
  console.log(weatherData);
  return { address, coords: activeCoords, weatherData, loading };
};

export default useLocation;
