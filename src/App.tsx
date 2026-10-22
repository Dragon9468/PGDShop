import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { PosView } from './components/PosView';
import { CustomerDisplayView } from './components/CustomerDisplayView';
import { ShelfManagementView } from './components/ShelfManagementView';
import { PreparedProductsView } from './components/PreparedProductsView';
import { OnlineOrdersView } from './components/OnlineOrdersView';
import { InventoryView } from './components/InventoryView';
import { WholesaleView } from './components/WholesaleView';
import { CapExView } from './components/CapExView';
import { OpExView } from './components/OpExView';
import { CapitalTrackingView } from './components/CapitalTrackingView';
import { SettingsView } from './components/SettingsView';
import { storageService } from './services/storageService';
import { soundService } from './services/soundService';
import { AppSettings } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isCustomerFacingDisplay, setIsCustomerFacingDisplay] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(settings.isAudioEnabled);

  useEffect(() => {
    // Kiểm tra xem trang có đang mở ở chế độ Màn Hình Phụ (Customer Facing Display) không
    const checkRoute = () => {
      const hash = window.location.hash;
      if (hash.includes('customer-display')) {
        setIsCustomerFacingDisplay(true);
      } else {
        setIsCustomerFacingDisplay(false);
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  const handleToggleAudio = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    soundService.setEnabled(newState);
    const updatedSettings = { ...settings, isAudioEnabled: newState };
    setSettings(updatedSettings);
    storageService.saveSettings(updatedSettings);
  };

  // NẾU LÀ CỬA SỔ MÀN HÌNH ĐỐI DIỆN KHÁCH HÀNG (MÀN 2):
  if (isCustomerFacingDisplay) {
    return <CustomerDisplayView settings={settings} />;
  }

  // MÀN HÌNH QUẢN TRỊ VÀ THU NGÂN QUẦY (MÀN 1):
  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.location.hash = tab === 'pos' ? '' : `#/${tab}`;
        }}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'pos' && <PosView settings={settings} />}
        {activeTab === 'customer_display' && <CustomerDisplayView settings={settings} />}
        {activeTab === 'shelves' && <ShelfManagementView />}
        {activeTab === 'prepared' && <PreparedProductsView />}
        {activeTab === 'online_orders' && <OnlineOrdersView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'wholesale' && <WholesaleView settings={settings} />}
        {activeTab === 'capex' && <CapExView />}
        {activeTab === 'opex' && <OpExView />}
        {activeTab === 'capital' && <CapitalTrackingView />}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
