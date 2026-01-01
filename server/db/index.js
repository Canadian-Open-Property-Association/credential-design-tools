/**
 * Database Connection
 *
 * Provides PostgreSQL connection using Drizzle ORM.
 * Connection is established lazily on first use.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

// Database connection pool (lazy initialization)
let db = null;
let pool = null;

/**
 * Get database connection
 * Creates connection on first call, reuses on subsequent calls
 */
export function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.warn('DATABASE_URL not set - Forms Builder database features will be unavailable');
      return null;
    }

    try {
      pool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Maximum connections in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      db = drizzle(pool, { schema });
      console.log('Forms Builder: PostgreSQL connection established');
    } catch (error) {
      console.error('Forms Builder: Failed to connect to PostgreSQL:', error.message);
      return null;
    }
  }

  return db;
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable() {
  const database = getDb();
  if (!database) return false;

  try {
    // Simple query to check connection
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Forms Builder: Database health check failed:', error.message);
    return false;
  }
}

/**
 * Initialize database tables
 * Creates tables if they don't exist
 */
export async function initializeDatabase() {
  const database = getDb();
  if (!database) {
    console.warn('Forms Builder: Skipping database initialization - no connection');
    return false;
  }

  try {
    // Create tables using raw SQL (Drizzle migrations would be better for production)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        slug UUID,
        schema JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        mode VARCHAR(20) NOT NULL DEFAULT 'simple',
        author_name VARCHAR(255),
        author_email VARCHAR(255),
        author_organization VARCHAR(255),
        github_user_id VARCHAR(255),
        github_username VARCHAR(255),
        cloned_from UUID,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        published_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
      CREATE INDEX IF NOT EXISTS idx_forms_github_user ON forms(github_user_id);
      CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
    `);

    console.log('Forms Builder: Database tables initialized');
    return true;
  } catch (error) {
    console.error('Forms Builder: Failed to initialize database:', error.message);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('Forms Builder: PostgreSQL connection closed');
  }
}

export { schema };
