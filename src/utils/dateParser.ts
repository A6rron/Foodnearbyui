// Parse various date formats and determine if event is today or upcoming
export function parseEventTime(timeString: string): {
  date: Date;
  isToday: boolean;
  isPast: boolean;
} {
  if (!timeString || timeString.trim() === '') {
    // Default to tomorrow if no time provided
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return { date: tomorrow, isToday: false, isPast: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0); // Start of today for comparison
  
  let eventDate: Date;
  
  // Handle "Today, 5:00 PM" format
  if (timeString.toLowerCase().includes('today')) {
    const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      eventDate = new Date(today);
      eventDate.setHours(hours, minutes, 0, 0);
    } else {
      eventDate = new Date(today);
      eventDate.setHours(23, 59, 0, 0); // End of today if no time specified
    }
  }
  // Handle "Tomorrow" format
  else if (timeString.toLowerCase().includes('tomorrow')) {
    const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      tomorrow.setHours(hours, minutes, 0, 0);
    } else {
      tomorrow.setHours(12, 0, 0, 0);
    }
    
    eventDate = tomorrow;
  }
  // Handle various date formats like "1 Nov 2025", "21 Nov", "Nov 21", etc.
  else {
    // Split by comma to separate date and time
    const parts = timeString.split(',').map(s => s.trim());
    const dateStr = parts[0];
    const timeStr = parts[1];
    
    // Parse date part with regex: matches "1 Nov 2025", "21 Nov", "Nov 21", "Dec 25 2025", etc.
    const dateMatch = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+(\d{4}))?|([A-Za-z]{3,})\s+(\d{1,2})(?:\s+(\d{4}))?/i);
    
    if (dateMatch) {
      let day: number;
      let monthStr: string;
      let year: number | undefined;
      
      if (dateMatch[1]) {
        // Format: "1 Nov" or "1 Nov 2025"
        day = parseInt(dateMatch[1]);
        monthStr = dateMatch[2];
        year = dateMatch[3] ? parseInt(dateMatch[3]) : undefined;
      } else {
        // Format: "Nov 1" or "Nov 1 2025"
        monthStr = dateMatch[4];
        day = parseInt(dateMatch[5]);
        year = dateMatch[6] ? parseInt(dateMatch[6]) : undefined;
      }
      
      const monthMap: { [key: string]: number } = {
        'jan': 0, 'january': 0,
        'feb': 1, 'february': 1,
        'mar': 2, 'march': 2,
        'apr': 3, 'april': 3,
        'may': 4,
        'jun': 5, 'june': 5,
        'jul': 6, 'july': 6,
        'aug': 7, 'august': 7,
        'sep': 8, 'september': 8,
        'oct': 9, 'october': 9,
        'nov': 10, 'november': 10,
        'dec': 11, 'december': 11
      };
      
      const month = monthMap[monthStr.toLowerCase()];
      let eventYear = year || now.getFullYear();
      
      // If the date has passed this year and no year specified, assume next year
      if (!year) {
        const testDate = new Date(eventYear, month, day);
        testDate.setHours(0, 0, 0, 0);
        if (testDate < today) {
          eventYear += 1;
        }
      }
      
      eventDate = new Date(eventYear, month, day);
      
      // Parse time if provided
      if (timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3].toLowerCase();
          
          if (period === 'pm' && hours !== 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
          
          eventDate.setHours(hours, minutes, 0, 0);
        } else {
          eventDate.setHours(12, 0, 0, 0); // Default to noon if time format not recognized
        }
      } else {
        eventDate.setHours(12, 0, 0, 0); // Default to noon if no time specified
      }
    } else {
      // Fallback to Date constructor
      eventDate = new Date(timeString);
      if (isNaN(eventDate.getTime())) {
        // If all parsing fails, default to tomorrow
        eventDate = new Date(today);
        eventDate.setDate(eventDate.getDate() + 1);
        eventDate.setHours(12, 0, 0, 0);
      }
    }
  }
  
  // Check if event is today
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  eventDateOnly.setHours(0, 0, 0, 0);
  const isToday = eventDateOnly.getTime() === today.getTime();
  
  // Check if event is in the past
  // For today's events, check if the time has passed
  // For other dates, check if the date is before today
  const isPast = eventDate < now;
  
  return { date: eventDate, isToday, isPast };
}

export function formatEventTime(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  const timeString = `${displayHours}:${displayMinutes} ${period}`;
  
  // Check if it's today
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `Today at ${timeString}`;
  }
  
  // Check if it's tomorrow
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return `Tomorrow at ${timeString}`;
  }
  
  // Otherwise show full date
  return `${day} ${month} at ${timeString}`;
}
