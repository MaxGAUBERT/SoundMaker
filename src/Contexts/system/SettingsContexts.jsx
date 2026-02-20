import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  
  // Charger les settings depuis localStorage ou utiliser les valeurs par défaut
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") {
      return {
        darkMode: false,
        autoSave: true,
        historyEnabled: true,
        bpm: 130,
        sampleRate: 44100,
        bufferSize: 256,
        channels: null
      };
    }

    const saved = localStorage.getItem("settings");

    return saved
      ? JSON.parse(saved)
      : {
          darkMode: false,
          autoSave: true,
          historyEnabled: true,
          bpm: 130,
          sampleRate: 44100,
          bufferSize: 256,
        };
  });

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  // Fonction générique d’update
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
