import { useContext, createContext } from "react";
//import { useTheme } from "./ThemeContext"; 

const GlobalColorContext = createContext(null);
export const useGlobalColorContext = () => useContext(GlobalColorContext);

const GlobalColorContextProvider = ({ children }) => {
  //const { themeStyles } = useTheme(); 

  // On expose directement les couleurs dérivées du theme
  const colorsComponent = {
    Text: "white",    
    TextIO: "gray.500",       
    Button: "gray.500",
    TransportButtons: "gray.700",
    Background: "gray.600",
    Border: "gray.900",
  };

  return (
    <GlobalColorContext.Provider value={{ colorsComponent }}>
      {children}
    </GlobalColorContext.Provider>
  );
};

export default GlobalColorContextProvider;
