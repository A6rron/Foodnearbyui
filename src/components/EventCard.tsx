import { MapPin, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface EventCardProps {
  event: {
    id: string | number;
    name: string;
    location: string;
    lat: number | null;
    lng: number | null;
    category: string;
    verified: boolean;
    distance: number;
    displayTime: string;
    isToday: boolean;
  };
}

export function EventCard({ event }: EventCardProps) {
  const hasCoordinates = event.lat != null && event.lng != null && !isNaN(event.lat) && !isNaN(event.lng);
  const googleMapsUrl = hasCoordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  return (
    <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start gap-2 mb-2.5 sm:mb-3 flex-wrap">
            <h3 className="text-white text-base sm:text-lg font-semibold">{event.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {event.isToday && (
                <Badge className="bg-red-500 hover:bg-red-500 rounded-full text-[10px] sm:text-xs px-2 py-0.5">
                  Today
                </Badge>
              )}
              {event.verified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center flex-shrink-0 cursor-help">
                        <CheckCircle2 className="size-4 sm:size-5 text-green-500 transition-all hover:scale-110 hover:text-green-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified by admin</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          {event.category && event.category.trim() !== '' && (
            <div className="text-gray-400 mb-2.5 sm:mb-3 text-sm">{event.category}</div>
          )}
          
          <div className="flex flex-col gap-2">
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-gray-300 hover:text-white active:text-white transition-colors group"
              >
                <MapPin className="size-3.5 sm:size-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm break-words flex-1">{event.location}</span>
                <ExternalLink className="size-3 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              </a>
            ) : (
              <div className="flex items-start gap-2 text-gray-300">
                <MapPin className="size-3.5 sm:size-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm break-words flex-1">{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
              {hasCoordinates && event.distance !== Infinity && (
                <>
                  <span className="text-gray-400">{event.distance.toFixed(1)} km away</span>
                  <span className="text-gray-600">•</span>
                </>
              )}
              
              <div className="flex items-center gap-1.5 text-gray-300">
                <Clock className="size-3.5 sm:size-4 flex-shrink-0" />
                <span>{event.displayTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}