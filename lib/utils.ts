export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('Failed to fetch')) {
      return 'Could not connect to the server. Please check your connection and try again.';
    }
    if (msg.includes('timed out')) {
      return 'Request timed out. The chain may still be processing. Please try again.';
    }
    return msg;
  }
  return String(error);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
