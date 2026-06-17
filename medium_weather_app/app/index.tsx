import React, { useState } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CAppbar from "./CAppbar";

export default function App() {
  const [state, setState] = useState(true);
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CAppbar />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
