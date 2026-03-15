import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env first, then override with .env.local if present
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
