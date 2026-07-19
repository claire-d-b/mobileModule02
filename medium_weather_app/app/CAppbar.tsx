import React, { useState, useEffect } from "react";
import { View, useWindowDimensions, ScrollView } from "react-native";
import { Appbar, Text, IconButton, Icon, Menu } from "react-native-paper";
import CTextInput from "./CTextInput";
import CBottomNav from "./CBottomNav";
import { useLocation, getPlacesList } from "../hooks/useLocation";

interface Place {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function CAppbar() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [tabIndex, setTabIndex] = React.useState(0);

  const [selectedCoords, setSelectedCoords] = useState<Coordinates | undefined>(
    undefined,
  );
  const {
    address: detectedAddress,
    coords,
    weatherData,
    loading,
    error: weatherError,
  } = useLocation(selectedCoords);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [placesList, setPlacesList] = useState<Place[]>([]);
  const [visible, setVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearchSubmit = () => {
    if (placesList.length > 0) {
      const p = placesList[0];
      setLocation(`${p.name}, ${p.admin1}, ${p.country}`);
      setSelectedCoords({ latitude: p.latitude, longitude: p.longitude });
      setErrorMessage("");
    } else {
      setLocation("");
      setSelectedCoords(undefined);
      setErrorMessage("Location not found.");
    }
    setVisible(false);
  };

  useEffect(() => {
    if (detectedAddress && location === "") {
      setLocation(detectedAddress);
    }
  }, [detectedAddress]);

  useEffect(() => {
    const fetchPlaces = async () => {
      const list = await getPlacesList(address);
      setPlacesList(list);
    };

    fetchPlaces();
  }, [address]);

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Appbar.Header
        style={{
          backgroundColor: "#534DB3",
          padding: 0,
          margin: 5,
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <View
          style={{
            display: "flex",
            height: "100%",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Icon source="magnify" color="white" size={20} />
          <CTextInput
            // onBlur={(e: any) => {
            //   if (!selectedCoords) {
            //     setLocation("");
            //     setErrorMessage("Location not found.");
            //   }
            // }}
            onChangeText={(text: string) => {
              setAddress(text);
              setVisible(true);
              setErrorMessage("");
            }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            textColor="white"
            label="Location"
            msg={address}
            placeholder="Search location..."
            variant="flat"
            outlineColor="white"
            activeOutlineColor="white"
            underlineColor="white"
            activeUnderlineColor="white"
            selectionColor="white"
            contentStyle={{}}
            style={{
              backgroundColor: "transparent",
              width: "75%",
              borderRadius: 15,
              borderColor: "white",
            }}
          />
        </View>
        <IconButton
          icon="navigation"
          iconColor="white"
          size={20}
          onPress={() => {
            setLocation(detectedAddress);
            setSelectedCoords(undefined);
            setErrorMessage("");
            setVisible(false);
          }}
          style={{ transform: "rotate(45deg);" }}
        />
      </Appbar.Header>
      <View
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {visible && !!placesList.length && (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {placesList.map((p, i) => (
              <View key={`place_${i}`}>
                <Menu.Item
                  title={
                    <>
                      <Text
                        style={{ fontWeight: "bold" }}
                      >{`${p.name}, `}</Text>
                      <Text>{`${p.admin1}, `}</Text>
                      <Text>{`${p.country}`}</Text>
                    </>
                  }
                  onPress={() => {
                    setLocation(`${p.name}, ${p.admin1}, ${p.country}`);
                    setSelectedCoords({
                      latitude: p.latitude,
                      longitude: p.longitude,
                    });
                    setErrorMessage("");
                    setVisible(false);
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
        {!visible && (
          <CBottomNav
            message={errorMessage || weatherError}
            location={location}
            weatherData={weatherData}
            index={tabIndex}
            onIndexChange={setTabIndex}
          />
        )}
      </View>
    </View>
  );
}
