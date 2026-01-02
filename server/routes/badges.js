/**
 * Badges API Routes
 *
 * Handle CRUD operations for badge definitions and settings.
 * Badges are governance artifacts that define criteria for earning
 * verifiable achievements.
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use ASSETS_PATH env var for persistent storage
const ASSETS_DIR = process.env.ASSETS_PATH || path.join(__dirname, '..', 'assets');
const BADGES_DIR = path.join(ASSETS_DIR, 'badges');
const BADGES_FILE = path.join(BADGES_DIR, 'badges.json');
const SETTINGS_FILE = path.join(BADGES_DIR, 'settings.json');

// Default settings for the Badges app
const DEFAULT_SETTINGS = {
  categories: [
    {
      id: 'equity',
      label: 'Equity Badges',
      description: 'Badges based on portfolio equity thresholds',
      color: '#10B981',
    },
    {
      id: 'property-count',
      label: 'Property Count Badges',
      description: 'Badges based on number of properties owned',
      color: '#6366F1',
    },
    {
      id: 'financial',
      label: 'Financial Status Badges',
      description: 'Badges related to mortgage, income, and credit status',
      color: '#F59E0B',
    },
    {
      id: 'verification',
      label: 'Verification Badges',
      description: 'Badges for identity, title, and other verifications',
      color: '#3B82F6',
    },
  ],
  proofMethods: [
    {
      id: 'range_proof',
      label: 'Range Proof',
      description: 'Proves a value falls within a range without revealing the exact value',
    },
    {
      id: 'count_proof',
      label: 'Count Proof',
      description: 'Proves a count meets or exceeds a threshold',
    },
    {
      id: 'credential_proof',
      label: 'Credential Proof',
      description: 'Proves possession of a valid credential',
    },
    {
      id: 'direct_attestation',
      label: 'Direct Attestation',
      description: 'Direct attestation from an authorized party',
    },
  ],
};

/**
 * Ensure badges directory exists
 */
async function ensureBadgesDir() {
  try {
    await fs.access(BADGES_DIR);
  } catch {
    await fs.mkdir(BADGES_DIR, { recursive: true });
  }
}

/**
 * Read badges from file
 */
async function readBadges() {
  try {
    await ensureBadgesDir();
    const data = await fs.readFile(BADGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { badges: [] };
    }
    throw error;
  }
}

/**
 * Write badges to file
 */
async function writeBadges(data) {
  await ensureBadgesDir();
  await fs.writeFile(BADGES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Read settings from file
 */
async function readSettings() {
  try {
    await ensureBadgesDir();
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
  await ensureBadgesDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/**
 * Middleware: Require authentication
 */
const requireAuth = (req, res, next) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ============================================
// Settings Endpoints
// ============================================

/**
 * GET /api/badges/settings
 * Get current badge settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await readSettings();
    if (settings) {
      res.json(settings);
    } else {
      res.json(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error reading badge settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

/**
 * PUT /api/badges/settings
 * Update badge settings
 */
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const currentSettings = await readSettings() || DEFAULT_SETTINGS;
    const { categories, proofMethods } = req.body;

    const settings = {
      categories: categories || currentSettings.categories,
      proofMethods: proofMethods || currentSettings.proofMethods,
    };

    await writeSettings(settings);
    res.json(settings);
  } catch (error) {
    console.error('Error updating badge settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/badges/settings/reset
 * Reset settings to defaults
 */
router.post('/settings/reset', requireAuth, async (req, res) => {
  try {
    await writeSettings(DEFAULT_SETTINGS);
    res.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error resetting badge settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// ============================================
// Badge CRUD Endpoints
// ============================================

/**
 * GET /api/badges
 * List all badge definitions
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const data = await readBadges();
    let badges = data.badges || [];

    // Filter by category if provided
    if (category) {
      badges = badges.filter((b) => b.categoryId === category);
    }

    // Filter by status if provided
    if (status) {
      badges = badges.filter((b) => b.status === status);
    }

    // Filter by search query if provided
    if (search && search.length >= 2) {
      const query = search.toLowerCase();
      badges = badges.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query)
      );
    }

    res.json(badges);
  } catch (error) {
    console.error('Error listing badges:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/badges/:id
 * Get a single badge definition
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Skip if this is a settings request (handled by earlier route)
    if (id === 'settings') {
      return res.status(404).json({ error: 'Badge not found' });
    }

    const data = await readBadges();
    const badge = (data.badges || []).find((b) => b.id === id);

    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    res.json(badge);
  } catch (error) {
    console.error('Error getting badge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/badges
 * Create a new badge definition
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = await readBadges();
    const badges = data.badges || [];
    const now = new Date().toISOString();

    const newBadge = {
      id: req.body.id,
      schemaId: req.body.schemaId || '',
      name: req.body.name,
      description: req.body.description || '',
      categoryId: req.body.categoryId || '',
      eligibilityRules: req.body.eligibilityRules || [],
      ruleLogic: req.body.ruleLogic || 'all',
      evidenceConfig: req.body.evidenceConfig || [],
      proofMethod: req.body.proofMethod || 'credential_proof',
      templateUri: req.body.templateUri || undefined,
      templateAssetId: req.body.templateAssetId || undefined,
      status: req.body.status || 'draft',
      version: req.body.version || '1.0',
      createdAt: now,
      updatedAt: now,
      createdBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    if (!newBadge.id || !newBadge.name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }

    // Check for duplicate ID
    if (badges.some((b) => b.id === newBadge.id)) {
      return res.status(409).json({ error: 'Badge with this ID already exists' });
    }

    badges.push(newBadge);
    await writeBadges({ badges });

    res.json(newBadge);
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/badges/:id
 * Update an existing badge definition
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readBadges();
    const badges = data.badges || [];
    const index = badges.findIndex((b) => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    const updatedBadge = {
      ...badges[index],
      schemaId: req.body.schemaId ?? badges[index].schemaId,
      name: req.body.name ?? badges[index].name,
      description: req.body.description ?? badges[index].description,
      categoryId: req.body.categoryId ?? badges[index].categoryId,
      eligibilityRules: req.body.eligibilityRules ?? badges[index].eligibilityRules,
      ruleLogic: req.body.ruleLogic ?? badges[index].ruleLogic,
      evidenceConfig: req.body.evidenceConfig ?? badges[index].evidenceConfig,
      proofMethod: req.body.proofMethod ?? badges[index].proofMethod,
      templateUri: req.body.templateUri ?? badges[index].templateUri,
      templateAssetId: req.body.templateAssetId ?? badges[index].templateAssetId,
      status: req.body.status ?? badges[index].status,
      version: req.body.version ?? badges[index].version,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    badges[index] = updatedBadge;
    await writeBadges({ badges });

    res.json(updatedBadge);
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/badges/:id
 * Delete a badge definition
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readBadges();
    const badges = data.badges || [];

    const index = badges.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    badges.splice(index, 1);
    await writeBadges({ badges });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
