import React, { useState } from "react";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CAppbar from "./CAppbar";

export default function App() {
  const [state, setState] = useState(true);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
        <PaperProvider theme={MD3LightTheme}>
          <CAppbar />
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
