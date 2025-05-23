
import React from 'react';
import DataSyncTests from '@/tests/DataSyncTests';
import AppHeader from '@/components/AppHeader';

const DataSyncTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="pt-20">
        <DataSyncTests />
      </div>
    </div>
  );
};

export default DataSyncTestPage;
