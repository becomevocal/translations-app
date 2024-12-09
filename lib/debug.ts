import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export function debugLog(data: any, prefix: string = "") {
  // Only log in development environment
  if (process.env.NODE_ENV !== "development") return;

  try {
    const logsDir = join(process.cwd(), "logs");
    mkdirSync(logsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${prefix}debug-${timestamp}.json`;

    writeFileSync(join(logsDir, filename), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write debug log:", error);
  }
}
