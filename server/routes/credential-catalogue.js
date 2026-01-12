/**
 * Credential Catalogue Routes
 *
 * API endpoints for managing imported external AnonCreds credentials
 * for verification testing.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrbitApiConfig } from '../lib/orbitConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Storage paths
const getDataDir = () => {
  const assetsPath = process.env.ASSETS_PATH || path.join(__dirname, '..', 'assets');
  const credCatalogueDir = path.join(assetsPath, 'credential-catalogue');
  if (!fs.existsSync(credCatalogueDir)) {
    fs.mkdirSync(credCatalogueDir, { recursive: true });
  }
  return credCatalogueDir;
};

const getCredentialsFile = () => path.join(getDataDir(), 'credentials.json');
const getTagsFile = () => path.join(getDataDir(), 'tags.json');

// Default ecosystem tags (all deletable by user)
const DEFAULT_ECOSYSTEM_TAGS = [
  { id: 'bc-digital-trust', name: 'BC Digital Trust' },
  { id: 'sovrin', name: 'Sovrin' },
  { id: 'candy', name: 'CANdy' },
  { id: 'indicio', name: 'Indicio' },
  { id: 'other', name: 'Other' },
];

/**
 * Ensure storage files exist with defaults
 */
const ensureStorage = () => {
  const credFile = getCredentialsFile();
  const tagsFile = getTagsFile();

  if (!fs.existsSync(credFile)) {
    fs.writeFileSync(credFile, '[]', 'utf-8');
  }
  if (!fs.existsSync(tagsFile)) {
    // Initialize with default tags
    fs.writeFileSync(tagsFile, JSON.stringify(DEFAULT_ECOSYSTEM_TAGS, null, 2), 'utf-8');
  }
};

/**
 * Read credentials from storage
 */
const readCredentials = () => {
  ensureStorage();
  return JSON.parse(fs.readFileSync(getCredentialsFile(), 'utf-8'));
};

/**
 * Write credentials to storage
 */
const writeCredentials = (credentials) => {
  ensureStorage();
  fs.writeFileSync(getCredentialsFile(), JSON.stringify(credentials, null, 2), 'utf-8');
};

/**
 * Read custom tags from storage
 */
const readTags = () => {
  ensureStorage();
  return JSON.parse(fs.readFileSync(getTagsFile(), 'utf-8'));
};

/**
 * Write custom tags to storage
 */
const writeTags = (tags) => {
  ensureStorage();
  fs.writeFileSync(getTagsFile(), JSON.stringify(tags, null, 2), 'utf-8');
};

// ============ Orbit Integration ============

/**
 * Import an external schema with Orbit Credential Management API
 *
 * API Endpoint: POST /api/lob/{lob_id}/schema/store
 * Reference: https://northern-block.gitbook.io/orbit-enterprise-api-documentation/api-modules/credential-management-api/import-an-external-schema
 */
const registerSchemaWithOrbit = async (schemaData) => {
  const orbitConfig = getOrbitApiConfig('credentialMgmt');

  // Debug: Log Orbit config (mask API key)
  console.log('[CredentialCatalogue] ====== ORBIT SCHEMA IMPORT DEBUG ======');
  console.log('[CredentialCatalogue] Orbit Config:', {
    hasConfig: !!orbitConfig,
    baseUrl: orbitConfig?.baseUrl || 'NOT SET',
    lobId: orbitConfig?.lobId || 'NOT SET',
    hasApiKey: !!orbitConfig?.apiKey,
    apiKeyPreview: orbitConfig?.apiKey ? `${orbitConfig.apiKey.substring(0, 8)}...` : 'NOT SET',
  });

  if (!orbitConfig) {
    throw new Error('Orbit Credential Management API not configured. Please configure it in Settings → Orbit Configuration.');
  }

  const { baseUrl, lobId, apiKey } = orbitConfig;

  if (!lobId) {
    throw new Error('Orbit LOB ID not configured. Please configure it in Settings → Orbit Configuration.');
  }

  // Normalize baseUrl to remove trailing slashes
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  // Prepare schema import payload per Orbit API spec
  // Reference: https://northern-block.gitbook.io/orbit-enterprise-api-documentation/api-modules/credential-management-api/import-an-external-schema
  const payload = {
    schemaInfo: {
      schemaLedgerId: schemaData.schemaId, // e.g., "DID:2:name:version"
      credentialFormat: 'ANONCRED',
      // governanceUrl is optional
    },
  };

  const url = `${normalizedBaseUrl}/api/lob/${lobId}/schema/store`;
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'api-key': apiKey }),
  };

  // Debug: Log full request details
  console.log('[CredentialCatalogue] Schema Import Request:');
  console.log('[CredentialCatalogue]   URL:', url);
  console.log('[CredentialCatalogue]   Method: POST');
  console.log('[CredentialCatalogue]   Headers:', {
    'Content-Type': headers['Content-Type'],
    'api-key': headers['api-key'] ? `${headers['api-key'].substring(0, 8)}...` : 'NOT SET',
  });
  console.log('[CredentialCatalogue]   Payload:', JSON.stringify(payload, null, 2));
  console.log('[CredentialCatalogue]   Schema Data Received:', {
    schemaId: schemaData.schemaId,
    name: schemaData.name,
    version: schemaData.version,
    attributeCount: schemaData.attributes?.length || 0,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // Debug: Log response details
  console.log('[CredentialCatalogue] Schema Import Response:');
  console.log('[CredentialCatalogue]   Status:', response.status, response.statusText);
  console.log('[CredentialCatalogue]   Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CredentialCatalogue] ====== ORBIT SCHEMA IMPORT FAILED ======');
    console.error('[CredentialCatalogue] Status:', response.status);
    console.error('[CredentialCatalogue] Error Body:', errorText);
    console.error('[CredentialCatalogue] Possible causes:');
    console.error('[CredentialCatalogue]   - 401/403: API key invalid or missing permissions');
    console.error('[CredentialCatalogue]   - 404: Wrong LOB ID or endpoint path');
    console.error('[CredentialCatalogue]   - 422: LOB role may not have permission to store schemas (check if LOB is configured as Holder vs Issuer/Verifier)');
    console.error('[CredentialCatalogue] ==========================================');
    throw new Error(`Failed to import schema to Orbit: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[CredentialCatalogue] ====== ORBIT SCHEMA IMPORT SUCCESS ======');
  console.log('[CredentialCatalogue] Response:', JSON.stringify(result, null, 2));
  console.log('[CredentialCatalogue] ==========================================');
  return result;
};

/**
 * Import an external credential definition with Orbit Credential Management API
 *
 * API Endpoint: POST /api/lob/{lob_id}/cred-def/store
 * Reference: https://northern-block.gitbook.io/orbit-enterprise-api-documentation/api-modules/credential-management-api/import-an-external-credential-definition
 */
const registerCredDefWithOrbit = async (credDefData, orbitSchemaId) => {
  const orbitConfig = getOrbitApiConfig('credentialMgmt');

  // Debug: Log Orbit config (mask API key)
  console.log('[CredentialCatalogue] ====== ORBIT CRED DEF IMPORT DEBUG ======');
  console.log('[CredentialCatalogue] Orbit Config:', {
    hasConfig: !!orbitConfig,
    baseUrl: orbitConfig?.baseUrl || 'NOT SET',
    lobId: orbitConfig?.lobId || 'NOT SET',
    hasApiKey: !!orbitConfig?.apiKey,
  });
  console.log('[CredentialCatalogue] Orbit Schema ID (from schema import):', orbitSchemaId);

  if (!orbitConfig) {
    throw new Error('Orbit Credential Management API not configured. Please configure it in Settings → Orbit Configuration.');
  }

  const { baseUrl, lobId, apiKey } = orbitConfig;

  if (!lobId) {
    throw new Error('Orbit LOB ID not configured. Please configure it in Settings → Orbit Configuration.');
  }

  // Normalize baseUrl to remove trailing slashes
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  // Prepare credential definition import payload per Orbit API spec
  // Reference: https://northern-block.gitbook.io/orbit-enterprise-api-documentation/api-modules/credential-management-api/import-an-external-credential-definition
  const payload = {
    schemaId: orbitSchemaId, // Orbit's internal schema ID from the schema import response
    credentialDefinitionId: credDefData.credDefId, // e.g., "DID:3:CL:seqNo:tag"
    description: `${credDefData.name || 'Imported credential'} - imported from external ledger`,
    addCredDef: false, // Don't create governance for imported cred defs
  };

  const url = `${normalizedBaseUrl}/api/lob/${lobId}/cred-def/store`;
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'api-key': apiKey }),
  };

  // Debug: Log full request details
  console.log('[CredentialCatalogue] Cred Def Import Request:');
  console.log('[CredentialCatalogue]   URL:', url);
  console.log('[CredentialCatalogue]   Method: POST');
  console.log('[CredentialCatalogue]   Payload:', JSON.stringify(payload, null, 2));
  console.log('[CredentialCatalogue]   Cred Def Data Received:', {
    credDefId: credDefData.credDefId,
    name: credDefData.name,
    tag: credDefData.tag,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // Debug: Log response details
  console.log('[CredentialCatalogue] Cred Def Import Response:');
  console.log('[CredentialCatalogue]   Status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CredentialCatalogue] ====== ORBIT CRED DEF IMPORT FAILED ======');
    console.error('[CredentialCatalogue] Status:', response.status);
    console.error('[CredentialCatalogue] Error Body:', errorText);
    console.error('[CredentialCatalogue] Possible causes:');
    console.error('[CredentialCatalogue]   - 401/403: API key invalid or missing permissions');
    console.error('[CredentialCatalogue]   - 404: Wrong LOB ID, schema ID, or endpoint path');
    console.error('[CredentialCatalogue]   - 422: LOB role may not have permission, or schema not found');
    console.error('[CredentialCatalogue] ==========================================');
    throw new Error(`Failed to import credential definition to Orbit: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[CredentialCatalogue] ====== ORBIT CRED DEF IMPORT SUCCESS ======');
  console.log('[CredentialCatalogue] Response:', JSON.stringify(result, null, 2));
  console.log('[CredentialCatalogue] ==========================================');
  return result;
};

/**
 * GET /api/credential-catalogue/orbit-status
 * Check if Orbit Credential Management API is configured
 */
router.get('/orbit-status', (req, res) => {
  try {
    const orbitConfig = getOrbitApiConfig('credentialMgmt');
    res.json({
      configured: !!orbitConfig?.baseUrl,
      hasCredentials: !!(orbitConfig?.lobId && orbitConfig?.apiKey),
    });
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to check Orbit status:', err);
    res.status(500).json({ error: 'Failed to check Orbit status' });
  }
});

// ============ Tag Endpoints ============
// NOTE: Tag routes MUST come before /:id routes to avoid /tags being matched as an id

/**
 * GET /api/credential-catalogue/tags
 * List custom ecosystem tags
 */
router.get('/tags', (req, res) => {
  try {
    const tags = readTags();
    res.json(tags);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to list tags:', err);
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

/**
 * POST /api/credential-catalogue/tags
 * Add a custom ecosystem tag
 */
router.post('/tags', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      isPredefined: false,
    };

    const tags = readTags();

    // Check for duplicates
    if (tags.some((t) => t.id === tag.id)) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    tags.push(tag);
    writeTags(tags);

    console.log('[CredentialCatalogue] Added custom tag:', tag.name);
    res.status(201).json(tag);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to add tag:', err);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

/**
 * DELETE /api/credential-catalogue/tags/:id
 * Remove an ecosystem tag
 */
router.delete('/tags/:id', (req, res) => {
  try {
    const tags = readTags();
    const index = tags.findIndex((t) => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    tags.splice(index, 1);
    writeTags(tags);

    console.log('[CredentialCatalogue] Deleted tag:', req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to delete tag:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============ Credential Endpoints ============

/**
 * GET /api/credential-catalogue
 * List all imported credentials
 */
router.get('/', (req, res) => {
  try {
    const credentials = readCredentials();
    res.json(credentials);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to list credentials:', err);
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

/**
 * POST /api/credential-catalogue
 * Import a new credential
 */
router.post('/', async (req, res) => {
  try {
    const {
      schemaData,
      credDefData,
      ecosystemTagId,
      issuerName,
      schemaSourceUrl,
      credDefSourceUrl,
      registerWithOrbit,
    } = req.body;

    // Validate required fields
    if (!schemaData || !credDefData || !ecosystemTagId) {
      return res.status(400).json({
        error: 'Missing required fields: schemaData, credDefData, ecosystemTagId',
      });
    }

    // Create credential record
    const credential = {
      id: uuidv4(),
      name: schemaData.name,
      version: schemaData.version,
      schemaId: schemaData.schemaId,
      credDefId: credDefData.credDefId,
      issuerDid: schemaData.issuerDid || credDefData.issuerDid,
      issuerName: issuerName || null,
      attributes: schemaData.attributes || [],
      ecosystemTag: ecosystemTagId,
      schemaSourceUrl: schemaSourceUrl,
      credDefSourceUrl: credDefSourceUrl,
      ledger: schemaData.ledger || credDefData.ledger,
      usageType: 'verification-only',
      importedAt: new Date().toISOString(),
      importedBy: req.session?.user?.email || req.session?.user?.login || 'unknown',
      orbitSchemaId: null,
      orbitCredDefId: null,
      orbitRegistrationError: null,
    };

    // Register with Orbit if requested
    if (registerWithOrbit) {
      try {
        // Import schema first
        const schemaResult = await registerSchemaWithOrbit(schemaData);
        // Orbit returns: { success: true, data: { schemaId: 1, schemaLedgerId: "...", schemaState: "available" } }
        const orbitSchemaId = schemaResult.data?.schemaId || schemaResult.schemaId;
        credential.orbitSchemaId = orbitSchemaId;

        // Import credential definition using Orbit's internal schema ID
        const credDefResult = await registerCredDefWithOrbit(
          { ...credDefData, name: schemaData.name },
          orbitSchemaId
        );
        // Orbit returns: { success: true, data: { credentialDefinitionId: "...", credentialId: 1 } }
        credential.orbitCredDefId = credDefResult.data?.credentialId || credDefResult.credentialId;

        console.log('[CredentialCatalogue] Successfully imported to Orbit');
      } catch (orbitErr) {
        console.error('[CredentialCatalogue] Orbit import failed:', orbitErr.message);
        // Store the error but still save the credential
        credential.orbitRegistrationError = orbitErr.message;
      }
    }

    // Save to storage
    const credentials = readCredentials();
    credentials.unshift(credential);
    writeCredentials(credentials);

    console.log('[CredentialCatalogue] Imported credential:', credential.name, credential.version);
    res.status(201).json(credential);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to import credential:', err);
    // Return the actual error message for debugging
    const errorMessage = err.message || 'Failed to import credential';
    res.status(500).json({
      error: errorMessage,
      details: err.message
    });
  }
});

// ============ Helper Functions for Parsing ============
// NOTE: These must be defined before the routes that use them

/**
 * Parse ledger name from IndyScan URL
 */
const parseLedgerFromUrl = (url) => {
  // CandyScan (various domains)
  if (url.includes('candyscan.idlab.org') || url.includes('candyscan.digitaltrust.gov.bc.ca')) {
    const match = url.match(/\/tx\/([^/]+)\//);
    if (match) {
      const network = match[1].toLowerCase();
      return `candy:${network.replace('candy_', '')}`;
    }
    return 'candy:dev';
  }

  if (url.includes('indyscan.io')) {
    const match = url.match(/\/txs\/([^/]+)\//);
    if (match) {
      const network = match[1].toLowerCase();
      return `sovrin:${network}`;
    }
    return 'sovrin:staging';
  }

  if (url.includes('bcovrin.vonx.io')) {
    if (url.includes('test.')) return 'bcovrin:test';
    if (url.includes('dev.')) return 'bcovrin:dev';
    return 'bcovrin:test';
  }

  return 'unknown';
};

/**
 * Parse schema data from fetched HTML
 * Handles IndyScan/CandyScan pages which embed data in __NEXT_DATA__ script tag
 */
const parseSchemaFromHtml = (html, sourceUrl) => {
  const result = {
    name: null,
    version: null,
    schemaId: null,
    issuerDid: null,
    attributes: [],
    ledger: parseLedgerFromUrl(sourceUrl),
    seqNo: null,
  };

  // First, try to extract from __NEXT_DATA__ script tag (IndyScan/CandyScan Next.js format)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const txData = nextData.props?.pageProps?.indyscanTx;

      if (txData) {
        // Get schema data from the expansion or serialized data
        const expansion = txData.expansion?.idata;
        const schemaData = expansion?.txn?.data?.data;

        if (schemaData) {
          result.name = schemaData.name;
          result.version = schemaData.version;
          result.attributes = schemaData.attr_names || [];
        }

        // Get metadata
        const txnMetadata = expansion?.txnMetadata;
        if (txnMetadata) {
          result.schemaId = txnMetadata.txnId;
          result.seqNo = txnMetadata.seqNo;
        }

        // Get issuer DID from metadata
        const metadata = expansion?.txn?.metadata;
        if (metadata?.from) {
          result.issuerDid = metadata.from;
        }

        // If we found data, return early
        if (result.name && result.version && result.attributes.length > 0) {
          console.log('[CredentialCatalogue] Parsed schema from __NEXT_DATA__:', result.name, 'with', result.attributes.length, 'attributes');
          return result;
        }
      }
    } catch (e) {
      console.log('[CredentialCatalogue] Failed to parse __NEXT_DATA__, falling back to regex:', e.message);
    }
  }

  // Fallback: Look for schema ID pattern (DID:2:name:version format)
  const schemaIdMatch = html.match(/([A-Za-z0-9]{21,}):2:([^:]+):([0-9.]+)/);
  if (schemaIdMatch) {
    result.schemaId = schemaIdMatch[0];
    result.issuerDid = schemaIdMatch[1];
    result.name = schemaIdMatch[2];
    result.version = schemaIdMatch[3];
  }

  // Fallback: Extract attributes from attr_names pattern in raw JSON
  const attrMatch = html.match(/"attr_names"\s*:\s*\[([\s\S]*?)\]/);
  if (attrMatch) {
    const attrs = attrMatch[1].match(/"([^"]+)"/g);
    if (attrs) {
      result.attributes = attrs.map((a) => a.replace(/"/g, ''));
    }
  }

  // Extract sequence number from URL if not found
  const seqMatch = sourceUrl.match(/\/domain\/(\d+)/);
  if (seqMatch) {
    result.seqNo = parseInt(seqMatch[1], 10);
  }

  return result;
};

/**
 * Parse credential definition data from fetched HTML
 * Handles IndyScan/CandyScan pages which embed data in __NEXT_DATA__ script tag
 */
const parseCredDefFromHtml = (html, sourceUrl) => {
  const result = {
    credDefId: null,
    schemaId: null,
    issuerDid: null,
    tag: 'default',
    signatureType: 'CL',
    ledger: parseLedgerFromUrl(sourceUrl),
    seqNo: null,
  };

  // First, try to extract from __NEXT_DATA__ script tag (IndyScan/CandyScan Next.js format)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const txData = nextData.props?.pageProps?.indyscanTx;

      if (txData) {
        // Get cred def data from the expansion
        const expansion = txData.expansion?.idata;
        const txnMetadata = expansion?.txnMetadata;

        if (txnMetadata?.txnId) {
          result.credDefId = txnMetadata.txnId;
          result.seqNo = txnMetadata.seqNo;
        }

        // Get issuer DID from metadata
        const metadata = expansion?.txn?.metadata;
        if (metadata?.from) {
          result.issuerDid = metadata.from;
        }

        // Get signature type and tag from txn data
        const txnData = expansion?.txn?.data;
        if (txnData) {
          result.signatureType = txnData.signature_type || 'CL';
          result.tag = txnData.tag || 'default';
        }

        // If we found the cred def ID, return early
        if (result.credDefId) {
          console.log('[CredentialCatalogue] Parsed cred def from __NEXT_DATA__:', result.credDefId);
          return result;
        }
      }
    } catch (e) {
      console.log('[CredentialCatalogue] Failed to parse __NEXT_DATA__, falling back to regex:', e.message);
    }
  }

  // Fallback: Look for credential definition ID pattern (DID:3:CL:schemaSeqNo:tag format)
  const credDefIdMatch = html.match(/([A-Za-z0-9]{21,}):3:CL:(\d+):([A-Za-z0-9_-]+)/);
  if (credDefIdMatch) {
    result.credDefId = credDefIdMatch[0];
    result.issuerDid = credDefIdMatch[1];
    result.tag = credDefIdMatch[3];
  }

  // Look for schema ID in page
  const schemaIdMatch = html.match(/([A-Za-z0-9]{21,}):2:([^:]+):([0-9.]+)/);
  if (schemaIdMatch) {
    result.schemaId = schemaIdMatch[0];
  }

  // Extract sequence number from URL
  const seqMatch = sourceUrl.match(/\/domain\/(\d+)/);
  if (seqMatch) {
    result.seqNo = parseInt(seqMatch[1], 10);
  }

  return result;
};

// ============ Import Parsing Endpoints ============
// NOTE: Import routes MUST come before /:id routes

/**
 * POST /api/credential-catalogue/import/schema
 * Parse an IndyScan schema URL
 */
router.post('/import/schema', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('[CredentialCatalogue] Parsing schema URL:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CredentialCatalogue/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const schemaData = parseSchemaFromHtml(html, url);

    if (!schemaData.name || !schemaData.version) {
      return res.status(400).json({
        error: 'Could not parse schema name and version from page. Please check the URL.',
      });
    }

    res.json(schemaData);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to parse schema URL:', err);
    res.status(400).json({ error: err.message || 'Failed to parse schema URL' });
  }
});

/**
 * POST /api/credential-catalogue/import/creddef
 * Parse an IndyScan credential definition URL
 */
router.post('/import/creddef', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('[CredentialCatalogue] Parsing credential definition URL:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CredentialCatalogue/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const credDefData = parseCredDefFromHtml(html, url);

    if (!credDefData.credDefId) {
      return res.status(400).json({
        error: 'Could not parse credential definition ID from page. Please check the URL.',
      });
    }

    res.json(credDefData);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to parse credential definition URL:', err);
    res.status(400).json({ error: err.message || 'Failed to parse credential definition URL' });
  }
});

// ============ Parameterized Credential Endpoints ============
// NOTE: These MUST come AFTER all specific path routes like /tags and /import/*

/**
 * GET /api/credential-catalogue/:id
 * Get a single credential by ID
 */
router.get('/:id', (req, res) => {
  try {
    const credentials = readCredentials();
    const credential = credentials.find((c) => c.id === req.params.id);

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json(credential);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to get credential:', err);
    res.status(500).json({ error: 'Failed to get credential' });
  }
});

/**
 * PATCH /api/credential-catalogue/:id
 * Update a credential (e.g., change ecosystem tag)
 */
router.patch('/:id', (req, res) => {
  try {
    const { ecosystemTag, issuerName } = req.body;
    const credentials = readCredentials();
    const index = credentials.findIndex((c) => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Update allowed fields
    if (ecosystemTag !== undefined) {
      credentials[index].ecosystemTag = ecosystemTag;
    }
    if (issuerName !== undefined) {
      credentials[index].issuerName = issuerName;
    }

    writeCredentials(credentials);

    console.log('[CredentialCatalogue] Updated credential:', req.params.id);
    res.json(credentials[index]);
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to update credential:', err);
    res.status(500).json({ error: 'Failed to update credential' });
  }
});

/**
 * DELETE /api/credential-catalogue/:id
 * Remove a credential from the catalogue
 */
router.delete('/:id', (req, res) => {
  try {
    const credentials = readCredentials();
    const index = credentials.findIndex((c) => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    credentials.splice(index, 1);
    writeCredentials(credentials);

    console.log('[CredentialCatalogue] Deleted credential:', req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('[CredentialCatalogue] Failed to delete credential:', err);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

export default router;
