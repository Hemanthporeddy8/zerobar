'use client';

import { useOnlineStatus } from './OfflineRegister';

export default function Header() {
  const online = useOnlineStatus();

  return (
    <div className="signalbar">
      <div className="signalbar-top">
        <div className="brand">
          <span className={`dot ${online ? '' : 'off'}`}></span>
          Zerobar
        </div>
      </div>
      <div className="status-label">
        {online ? "You're all caught up" : 'No signal — showing what you have saved'}
      </div>
    </div>
  );
}
