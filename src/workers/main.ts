import '../scripts/init-env'; // Load env vars first
import { logger } from '../lib/logger';

// Import all workers to register them with BullMQ
import '../workers/parser/index';
import '../workers/embedding/index';
import '../workers/matcher/index';
import '../workers/analytics/index';

logger.info('🚀 All background workers (Parser, Embedding, Matcher, Analytics) are initialized and listening.');
