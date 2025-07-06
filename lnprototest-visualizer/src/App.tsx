import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout, ContentLayout } from '@cloudscape-design/components';
import AppNavigation from './components/layout/AppNavigation';
import Header from './components/layout/Header';
import VisualizerPage from './pages/VisualizerPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import { apiClient } from './api/client';

function App() {
  const [navigationOpen, setNavigationOpen] = React.useState(false);

  const runExampleSequence = async () => {
    try {
      await apiClient.runConnectSequence('03');
    } catch (error) {
      console.error('Error running example sequence:', error);
    }
  };

  return (
    <AppLayout
      navigation={<AppNavigation />}
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      content={
        <ContentLayout header={<Header />}>
          <Routes>
            <Route path="/" element={<VisualizerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                onClick={runExampleSequence}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Run Example Connect Sequence
              </button>
            </div>
          </div>
        </ContentLayout>
      }
      toolsHide
    />
  );
}

export default App;