/**
 * Forms Builder Settings API Routes
 *
 * Handle settings configuration for the Forms Builder app.
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use ASSETS_PATH env var for persistent storage (same as proxy.js)
const ASSETS_DIR = process.env.ASSETS_PATH || path.join(__dirname, '..', 'assets');
const SETTINGS_FILE = path.join(ASSETS_DIR, 'forms-builder-settings.json');

const DEFAULT_SETTINGS = {
  credentialRegistryPath: 'credentials/branding',
};

/**
 * Ensure assets directory exists
 */
async function ensureAssetsDir() {
  try {
    await fs.access(ASSETS_DIR);
  } catch {
    await fs.mkdir(ASSETS_DIR, { recursive: true });
  }
}

/**
 * Read settings from file
 */
async function readSettings() {
  try {
    await ensureAssetsDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Write settings to file
 */
async function writeSettings(settings) {
  await ensureAssetsDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/**
 * GET /api/forms-builder/settings
 * Get current settings
 */
router.get('/', async (req, res) => {
  try {
    const settings = await readSettings();
    if (settings) {
      res.json(settings);
    } else {
      res.json(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

/**
 * PUT /api/forms-builder/settings
 * Update settings
 */
router.put('/', async (req, res) => {
  try {
    const { credentialRegistryPath } = req.body;

    const settings = {
      credentialRegistryPath: credentialRegistryPath || DEFAULT_SETTINGS.credentialRegistryPath,
    };

    await writeSettings(settings);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/forms-builder/settings/reset
 * Reset settings to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    await writeSettings(DEFAULT_SETTINGS);
    res.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
