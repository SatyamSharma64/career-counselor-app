// import { type ClassValue, clsx } from "clsx"
// import { twMerge } from "tailwind-merge"

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = (now.getTime() - past.getTime()) / 1000

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export function generateSessionTitle(firstMessage: string): string {
  // Extract first few words to create a meaningful title
  const words = firstMessage.trim().split(/\s+/).slice(0, 6)
  let title = words.join(" ")
  
  if (title.length > 50) {
    title = title.substring(0, 47) + "..."
  }
  
  return title || "New Chat"
}
