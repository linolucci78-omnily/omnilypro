import React, { useState } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

const POSDashboardWrapper: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <POSLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <OrganizationsDashboard
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </POSLayout>
  );
};

export default POSDashboardWrapper;