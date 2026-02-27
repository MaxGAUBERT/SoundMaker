// Contexts/AppProviders.jsx
import { ChannelProvider } from './ChannelProvider';
import { TransportProvider } from './TransportContext';
import { MenuActionsProvider } from '../system/MenuActionsContext';
import GlobalColorContextProvider from '../UI/GlobalColorContext';
import { useKeyboardShortcuts } from '../../hooks/system/useKeyboardShortcuts';
import { StorageProvider } from '../system/StorageContext';
import { PlaylistProvider } from './PlaylistProvider';
import { UndoManagerProvider } from '../system/UndoManagerContext';
import { UndoManagerBridge } from '../system/UndoManagerBridge';
import { HistoryProvider } from '../system/HistoryProvider';

function KeyboardShortcutsWrapper({ children }) {
  useKeyboardShortcuts(); 
  return <>{children}</>;
}


export default function AppProviders({ children }) {
  return (
    <StorageProvider>
      <HistoryProvider>
      <GlobalColorContextProvider>
        <UndoManagerProvider>
          <UndoManagerBridge />
          <ChannelProvider>
            <PlaylistProvider>
              <TransportProvider>
                <MenuActionsProvider>
                  <KeyboardShortcutsWrapper>
                    {children}
                  </KeyboardShortcutsWrapper>
                </MenuActionsProvider>
              </TransportProvider>
            </PlaylistProvider>
          </ChannelProvider>
          <UndoManagerBridge />
        </UndoManagerProvider>
      </GlobalColorContextProvider>
      </HistoryProvider>
    </StorageProvider>
  );
}