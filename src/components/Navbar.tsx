import { Button } from './ui/button';
import { HowItWorksPopover } from './HowItWorksPopover';

interface NavbarProps {
  onAddClick?: () => void;
  onLogoutClick?: () => void;
  isAdmin?: boolean;
}

export function Navbar({ onAddClick, onLogoutClick, isAdmin }: NavbarProps) {
  const handleAddEvent = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }

    const phoneNumber = '917304483935'; // No + or spaces
    const message = `1. *Event Name*:
2. *Date and Time*:
3. *Location*:
4. *Map Link*:`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleAdminClick = () => {
    if (isAdmin && onLogoutClick) {
      onLogoutClick();
    } else {
      window.location.hash = '#admin';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <span
            className="text-white text-base sm:text-lg tracking-wide leading-tight"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
          >
            {isAdmin ? 'Food Nearby Admin' : 'Food Nearby'}
          </span>
          <button
            onClick={handleAdminClick}
            className="text-gray-500 tracking-wide hover:text-gray-400 transition-colors text-left cursor-pointer text-[10px] sm:text-xs"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            title={isAdmin ? "Logout" : "Admin Panel"}
          >
            {isAdmin ? '- Logout' : '- At Your Risk'}
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isAdmin && <HowItWorksPopover />}
          <Button
            onClick={handleAddEvent}
            className="bg-white text-gray-900 hover:bg-gray-100 rounded-full text-xs sm:text-sm px-3 sm:px-4"
            size="sm"
          >
            <span className="hidden xs:inline">{isAdmin ? 'Add Event' : 'Add Event'}</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}