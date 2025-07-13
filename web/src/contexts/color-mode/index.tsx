import { RefineThemes } from "@refinedev/antd";
import { ConfigProvider, theme } from "antd";
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem("colorMode");
  const isSystemPreferenceDark = window?.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const systemPreference = isSystemPreferenceDark ? "dark" : "light";
  const [mode, setMode] = useState(
    colorModeFromLocalStorage || systemPreference
  );

  useEffect(() => {
    window.localStorage.setItem("colorMode", mode);
  }, [mode]);

  const setColorMode = () => {
    if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  // 自定义简约主题
  const customTheme = {
    token: {
      colorPrimary: '#6366f1', // 现代蓝紫色
      colorBgBase: mode === 'light' ? '#ffffff' : '#0f0f23',
      colorBgContainer: mode === 'light' ? '#ffffff' : '#1a1a2e',
      colorBgLayout: mode === 'light' ? '#f8fafc' : '#16213e',
      colorBgElevated: mode === 'light' ? '#ffffff' : '#1a1a2e',
      borderRadius: 12,
      wireframe: false,
      colorBorder: mode === 'light' ? '#e2e8f0' : '#2d3748',
      colorText: mode === 'light' ? '#1e293b' : '#f1f5f9',
      colorTextSecondary: mode === 'light' ? '#64748b' : '#94a3b8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      lineHeight: 1.6,
    },
    components: {
      Layout: {
        siderBg: mode === 'light' ? '#ffffff' : '#1a1a2e',
        headerBg: mode === 'light' ? '#ffffff' : '#1a1a2e',
        bodyBg: mode === 'light' ? '#f8fafc' : '#0f0f23',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: mode === 'light' ? '#f1f5f9' : '#2d3748',
        itemHoverBg: mode === 'light' ? '#f8fafc' : '#2a2a3e',
        itemColor: mode === 'light' ? '#64748b' : '#94a3b8',
        itemSelectedColor: '#6366f1',
        iconSize: 18,
      },
      Card: {
        borderRadiusLG: 16,
        paddingLG: 24,
      },
      Button: {
        borderRadius: 8,
        fontWeight: 500,
      }
    },
    algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
  };

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ConfigProvider theme={customTheme}>
        {children}
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
