/**
 * WebsiteManager - Legacy wrapper
 *
 * This component wraps WebsiteManagerV2 to maintain backward compatibility.
 * All new development should use WebsiteManagerV2 directly.
 */

import React from 'react';
import WebsiteManagerV2 from './WebsiteManagerV2';

const WebsiteManager: React.FC = () => {
  return <WebsiteManagerV2 />;
};

export default WebsiteManager;
