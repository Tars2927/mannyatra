import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

console.log('Starting migration...');
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient);

try {
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migration complete!');
} catch (e) {
  console.error('Migration failed:', e);
} finally {
  process.exit(0);
}
