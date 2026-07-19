import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import { getForecasts } from "../functions/forecasts";
import NetInfo from "@react-native-community/netinfo";

interface Coords {
  latitude: number | undefined;
  longitude: number | undefined;
}

export interface WeatherData {
  current: {
    time: Date | null | undefined;
    temperature_2m: number | null | undefined;
    weather_code: number | null | undefined;
    wind_speed_10m: number | null | undefined;
  };
  hourly: {
    time: Date[] | null | undefined;
    temperature_2m: Float32Array | null | undefined;
    weather_code: Float32Array | null | undefined;
    wind_speed_10m: Float32Array | null | undefined;
  };
  daily: {
    time: Date[];
    temperature_2m_max: Float32Array | null | undefined;
    temperature_2m_min: Float32Array | null | undefined;
    weather_code: Float32Array | null | undefined;
    wind_speed_10m_max: Float32Array | null | undefined;
  };
}

// expo-location est la librairie qui donne accès au GPS.
// Elle fait le pont entre JavaScript et les APIs natives du téléphone :
// Sans elle, tu ne peux pas accéder au GPS depuis React Native.
// C'est elle qui gère aussi les permissions (requestForegroundPermissionsAsync).

// Actually requests permission — this is the ONLY function that should
// trigger the native OS dialog. Call it once per app flow.
const requestPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

// Checks the current permission status WITHOUT prompting the user.
// Use this everywhere else instead of requestPermission().
const hasPermission = async (): Promise<boolean> => {
  const { status } = await Location.getForegroundPermissionsAsync();
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

// Get current location. Assumes permission has ALREADY been granted
// (checked/requested once upstream) — does not prompt itself.
const getLocation = async (): Promise<Coords | null> => {
  const granted = await hasPermission();
  if (!granted) return null;

  const gpsOn = await checkGPSEnabled();
  if (!gpsOn) {
    promptEnableGPS();
    return null;
  }

  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
};

// Track location changes. Assumes permission has ALREADY been granted —
// only checks, never prompts, so it can safely be called after getLocation()
// in the same init flow without a second dialog.
export const trackLocation = async (
  onChange: (coords: Coords) => void,
): Promise<Location.LocationSubscription | null> => {
  const granted = await hasPermission();
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
    .filter(Boolean) // .filter(Boolean) supprime les valeurs falsy du tableau avant de les joindre. Valeurs falsy = undefined, null, "", 0, false, NaN.
    .join(", ");
};

export const getPlacesList = async (location: string) => {
  if (!location) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=10&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results ?? [];
  } catch {
    console.error("Places fetch failed.");
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

  const [error, setError] = useState("");

  const activeCoords = externalCoords ?? coords;

  // Fetch ensemble weather when coords change
  useEffect(() => {
    const fetchForecasts = async () => {
      if (
        activeCoords.latitude === undefined ||
        activeCoords.longitude === undefined
      )
        return;

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setError("Internet connexion lost.");
        setWeatherData(null);
        return;
      }

      try {
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
        setError("");
      } catch {
        setWeatherData(null);
        setError("Unable to fetch weather data.");
      }
    };
    fetchForecasts();
  }, [activeCoords.latitude, activeCoords.longitude]);

  // Get location on mount and track changes
  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const init = async () => {
      // Single point where the native permission dialog can appear.
      const granted = await requestPermission();
      if (!granted) {
        setLoading(false);
        return;
      }

      const initialCoords = await getLocation(); // just checks now, no prompt
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

  // Track network connectivity and surface a message when offline
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        setError("Internet connexion lost.");
      } else {
        // clear only the connectivity message, don't stomp other errors
        setError((prev) => (prev === "Internet connexion lost." ? "" : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  // console.log(weatherData);
  return { address, coords: activeCoords, weatherData, loading, error };
};
