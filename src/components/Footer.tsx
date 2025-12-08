import { Github } from 'lucide-react';
import { A6IconFooter } from './A6IconFooter';

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-400">
          <a
            href="https://github.com/A6rron/food-nearby-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-white transition-colors text-sm sm:text-base py-2 px-2 -mx-2 rounded touch-manipulation"
          >
            <Github className="size-4 sm:size-5 flex-shrink-0" />
            <span className="hidden xs:inline">Open Source</span>
            <span className="xs:hidden">GitHub</span>
          </a>
          <span className="text-gray-600">|</span>
          <a
            href="https://a6rron.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="group py-2 px-2 -mx-2 rounded touch-manipulation"
          >
            <A6IconFooter />
          </a>
        </div>
      </div>
    </footer>
  );
}