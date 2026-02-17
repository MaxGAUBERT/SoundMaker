// Contexts/AppProviders.jsx
import { ChannelProvider } from './ChannelProvider';
import { TransportProvider } from './TransportContext';
import { MenuActionsProvider } from '../system/MenuActionsContext';
import GlobalColorContextProvider from '../UI/GlobalColorContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { StorageProvider } from '../system/StorageContext';
import { PlaylistProvider } from './PlaylistProvider';

function KeyboardShortcutsWrapper({ children }) {
  useKeyboardShortcuts(); 
  return <>{children}</>;
}

export default function AppProviders({ children }) {
  return (
    <StorageProvider> 
      <GlobalColorContextProvider>
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
      </GlobalColorContextProvider>
    </StorageProvider>
  );
}