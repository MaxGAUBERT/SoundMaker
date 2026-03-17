// Contexts/AppProviders.jsx
import { ChannelProvider } from './ChannelProvider';
import { TransportProvider } from './TransportContext';
import { MenuActionsProvider } from '../system/MenuActionsContext';
import GlobalColorContextProvider from '../UI/GlobalColorContext';
import { useKeyboardShortcuts } from '../../hooks/system/useKeyboardShortcuts';
import { StorageProvider } from '../system/StorageContext';
import { UndoManagerProvider } from '../system/UndoManagerContext';
import { UndoManagerBridge } from '../system/UndoManagerBridge';
import { HistoryProvider } from '../system/HistoryProvider';
import { SettingsProvider } from '../system/SettingsContexts';
import {ThemeProvider} from '../../Contexts/UI/ThemeContext';

function KeyboardShortcutsWrapper({ children }) {
  useKeyboardShortcuts(); 
  return <>{children}</>;
}


export default function AppProviders({ children }) {
  return (
    
    <StorageProvider>
      <ThemeProvider>
       <SettingsProvider>
      <HistoryProvider>
      <GlobalColorContextProvider>
        <UndoManagerProvider>
          <UndoManagerBridge />
          <ChannelProvider>
              <TransportProvider>
                <MenuActionsProvider>
                  <KeyboardShortcutsWrapper>
                    {children}
                  </KeyboardShortcutsWrapper>
                </MenuActionsProvider>
              </TransportProvider>
          </ChannelProvider>
          <UndoManagerBridge />
        </UndoManagerProvider>
      </GlobalColorContextProvider>
      </HistoryProvider>
        </SettingsProvider>
        </ThemeProvider>
    </StorageProvider>
  );
}