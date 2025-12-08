import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

export function HowItWorksPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center justify-center size-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          aria-label="How It Works"
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-96 bg-gray-900 border border-gray-700 text-white p-4 sm:p-5 mx-4 sm:mx-0" 
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-semibold text-white text-base sm:text-lg">How It Works</h3>
          
          <div className="text-sm text-gray-300 space-y-3 sm:space-y-4">
            {/* Flow */}
            <div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-gray-200 text-xs sm:text-sm mb-2 font-medium bg-gray-800 py-2 px-3 rounded">
                <span>User</span>
                <span className="text-gray-500">→</span>
                <span>WhatsApp</span>
                <span className="text-gray-500">→</span>
                <span>Bot</span>
                <span className="text-gray-500">→</span>
                <span>Website</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Submit free food events through WhatsApp. Our bot automatically reads and updates the website in real-time.
              </p>
            </div>

            {/* Submission Types */}
            <div className="space-y-2">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Submission Types</div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Send a poster or flyer</span>
                </div>
                <div className="text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Type event details</span>
                </div>
                <div className="text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Share photo with location</span>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="space-y-2">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Examples</div>
              <div className="space-y-2">
                <div className="bg-gray-800 p-2.5 sm:p-3 rounded border border-gray-700">
                  <div className="text-gray-500 text-[10px] sm:text-xs mb-1">Text Message:</div>
                  <div className="text-gray-200 text-xs sm:text-sm">"Marriage at MES Hall, 5 PM today"</div>
                </div>
                <div className="bg-gray-800 p-2.5 sm:p-3 rounded border border-gray-700">
                  <div className="text-gray-500 text-[10px] sm:text-xs mb-1">Poster Upload:</div>
                  <div className="text-gray-200 text-xs sm:text-sm">Wedding invitation card (auto-scanned)</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-700 text-center">
              <div className="text-white font-semibold text-sm sm:text-base">
                Food Nearby - <span className="text-yellow-400">At Your Risk</span>
              </div>
              <div className="text-gray-500 text-[10px] sm:text-xs mt-1.5">
                Events sorted by time and distance
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}