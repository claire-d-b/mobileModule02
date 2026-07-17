import * as React from "react";
import { BottomNavigation, Text } from "react-native-paper";
import { View, ScrollView } from "react-native";
import { WeatherData } from "../hooks/useLocation";
import getWeatherCode from "../functions/weatherCodes";
import PagerView from "react-native-pager-view";

interface RouteProps {
  location: string;
  data: WeatherData | null;
}

const CurrRoute = ({ location, data }: RouteProps) =>
  (location && data && (
    <View
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Currently</Text>
      <View style={{ padding: 20, width: "100%" }}>
        <Text>{location}</Text>
        <Text>{getWeatherCode(data?.current?.weather_code)}</Text>
        <Text>{data?.current?.temperature_2m?.toFixed(1)}°C</Text>
        <Text>{data?.current?.wind_speed_10m?.toFixed(1)}km/h</Text>
      </View>
    </View>
  )) || (
    <Text style={{ textAlign: "center", paddingTop: 20 }}>
      Geolocation is not available.
    </Text>
  );

interface TodayRouteProps {
  location: string;
  todayHourly: {
    time: Date;
    temperature_2m: number | undefined;
    weather_code: number | undefined;
    wind_speed_10m: number | undefined;
  }[];
}

interface WeeklyRouteProps {
  location: string;
  weekly: {
    time: Date;
    temperature_2m_max: number | undefined;
    temperature_2m_min: number | undefined;
    weather_code: number | undefined;
    wind_speed_10m_max: number | undefined;
  }[];
}

const truncate = (str: string, maxLength: number = 5) =>
  str.length > maxLength ? str.slice(0, maxLength) + "…" : str;

const TodayRoute = ({ location, todayHourly }: TodayRouteProps) =>
  (location && todayHourly && todayHourly.length > 0 && (
    <View
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Today</Text>
      <ScrollView style={{ padding: 20, width: "100%" }}>
        <Text>{location}</Text>
        {!!todayHourly?.length &&
          todayHourly.map((h, i) => {
            return (
              <View
                key={`hourly_${i}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>
                  {h.time.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}
                </Text>
                <Text>{h.temperature_2m?.toFixed(1)}°C</Text>
                <Text>{h.wind_speed_10m?.toFixed(1)}km/h</Text>
                <Text>{truncate(getWeatherCode(h.weather_code), 5)}</Text>
              </View>
            );
          })}
      </ScrollView>
    </View>
  )) || (
    <Text style={{ textAlign: "center", paddingTop: 20 }}>
      Geolocation is not available.
    </Text>
  );

const WeeklyRoute = ({ location, weekly }: WeeklyRouteProps) =>
  (location && weekly && weekly.length > 0 && (
    <View
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Weekly</Text>
      <ScrollView style={{ padding: 20, width: "100%" }}>
        <Text>{location}</Text>
        {!!weekly?.length &&
          weekly.map((w, i) => {
            return (
              <View
                key={`weekly_${i}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>
                  {w.time.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </Text>
                <Text>{w.temperature_2m_min?.toFixed(1)}°C</Text>
                <Text>{w.temperature_2m_max?.toFixed(1)}°C</Text>
                <Text>{truncate(getWeatherCode(w.weather_code), 5)}</Text>
              </View>
            );
          })}
      </ScrollView>
    </View>
  )) || (
    <Text style={{ textAlign: "center", paddingTop: 20 }}>
      Geolocation is not available.
    </Text>
  );

interface Props {
  message: string;
  location: string;
  weatherData: WeatherData | null;
  index: number;
  onIndexChange: (i: number) => void;
  style: {};
}

const CBottomNav = ({
  message,
  location,
  weatherData,
  style,
  index,
  onIndexChange,
}: Props) => {
  const pagerRef = React.useRef<PagerView>(null);

  const today = new Date();
  // const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {
      key: "currently",
      title: "Currently",
      focusedIcon: "cog",
      unfocusedIcon: "cog-outline",
    },
    {
      key: "today",
      title: "Today",
      focusedIcon: "calendar-today",
      unfocusedIcon: "calendar-today-outline",
    },
    {
      key: "weekly",
      title: "Weekly",
      focusedIcon: "calendar-week",
      unfocusedIcon: "calendar-week-outline",
    },
  ]);

  const jumpTo = (key: string) => {
    const newIndex = routes.findIndex((r) => r.key === key);
    if (newIndex !== -1) {
      pagerRef.current?.setPageWithoutAnimation(newIndex);
      onIndexChange(newIndex);
    }
  };

  const todayHourly =
    weatherData?.hourly?.time
      ?.map((time, i) => ({
        time,
        temperature_2m: weatherData.hourly.temperature_2m?.[i],
        weather_code: weatherData.hourly.weather_code?.[i],
        wind_speed_10m: weatherData.hourly.wind_speed_10m?.[i],
      }))
      .filter(({ time }) => {
        const timeUTC = Date.UTC(
          time.getUTCFullYear(),
          time.getUTCMonth(),
          time.getUTCDate(),
        );
        const todayUTC = Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        );
        return timeUTC === todayUTC;
      }) ?? [];
  const weekly =
    weatherData?.daily.time.map((time, i) => ({
      time,
      temperature_2m_max: weatherData.daily.temperature_2m_max?.[i],
      temperature_2m_min: weatherData.daily.temperature_2m_min?.[i],
      weather_code: weatherData.daily.weather_code?.[i],
      wind_speed_10m_max: weatherData.daily.wind_speed_10m_max?.[i],
    })) ?? [];

  const renderScene = BottomNavigation.SceneMap({
    currently: () =>
      message === "" ? (
        <CurrRoute location={location} data={weatherData} />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>{message}</Text>
        </View>
      ),
    today: () =>
      message === "" ? (
        <TodayRoute location={location} todayHourly={todayHourly} />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>{message}</Text>
        </View>
      ),
    weekly: () =>
      message === "" ? (
        <WeeklyRoute location={location} weekly={weekly} />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>{message}</Text>
        </View>
      ),
  });

  React.useEffect(() => {
    // submittingRef.current contient la valeur (ici false au départ).
    // On peut la lire ou la modifier à tout moment (submittingRef.current = true) — ça ne redéclenche jamais un re-render du composant, contrairement à setState.
    pagerRef.current?.setPageWithoutAnimation(index);
  }, [index]);

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={index}
        onPageSelected={(e) => onIndexChange(e.nativeEvent.position)}
      >
        {routes.map((route) => (
          <View key={route.key} style={{ flex: 1 }}>
            {renderScene({ route, jumpTo })}
          </View>
        ))}
      </PagerView>
      <BottomNavigation.Bar
        navigationState={{ index, routes }}
        onTabPress={({ route }) => {
          const newIndex = routes.findIndex((r) => r.key === route.key);
          pagerRef.current?.setPageWithoutAnimation(newIndex);
          onIndexChange(newIndex);
        }}
        activeColor="white"
        inactiveColor="white"
        activeIndicatorStyle={{ backgroundColor: "#534DB3" }}
        style={{ backgroundColor: "#534DB3" }}
      />
    </View>
  );
};

export default CBottomNav;
