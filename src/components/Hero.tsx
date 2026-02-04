import { MapPin, Loader2, MapPinOff } from 'lucide-react';

interface HeroProps {
  locationStatus: 'loading' | 'success' | 'error';
  onLocationClick: () => void;
  title?: string;
  description?: string;
}

export function Hero({ locationStatus, onLocationClick, title, description }: HeroProps) {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-[#0f172a] py-8 sm:py-10 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <button
          onClick={onLocationClick}
          className="mx-auto mb-4 sm:mb-6 transition-opacity hover:opacity-80 active:opacity-70 cursor-pointer"
          title={
            locationStatus === 'loading'
              ? 'Detecting location...'
              : locationStatus === 'success'
                ? 'Click to refresh location'
                : 'Click to enable location access'
          }
        >
          {locationStatus === 'loading' && (
            <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-300 animate-spin" />
          )}

          {locationStatus === 'success' && (
            <MapPin className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-500" />
          )}

          {locationStatus === 'error' && (
            <MapPinOff className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-500" />
          )}
        </button>

        <h1 className="text-white mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-semibold">
          {title || "Find Free Food Near You"}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          {description || (
            <>
              {locationStatus === 'loading' && 'Detecting your location...'}
              {locationStatus === 'success' && 'Events sorted by distance from your location'}
              {locationStatus === 'error' && 'Showing events near Aluva'}
            </>
          )}
        </p>
      </div>
    </div>
  );
}