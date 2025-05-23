
import React from 'react';
import DataSyncTests from '@/tests/DataSyncTests';
import AppHeader from '@/components/AppHeader';
import { Helmet } from 'react-helmet-async';

const DataSyncTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>TheSet - Data Sync Tests</title>
      </Helmet>
      <AppHeader />
      <div className="pt-20 pb-12">
        <DataSyncTests />
      </div>
    </div>
  );
};

export default DataSyncTestPage;
