import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, getOctokit } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Use ASSETS_PATH env var for persistent storage (same as proxy.js)
const ASSETS_DIR = process.env.ASSETS_PATH || path.join(__dirname, 'assets');

// Helper function to read Forms Builder settings
async function getFormsBuilderSettings() {
  try {
    const settingsPath = path.join(ASSETS_DIR, 'forms-builder-settings.json');
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Helper function to read VCT Builder / Data Registry settings
async function getDataRegistrySettings() {
  try {
    const settingsPath = path.join(ASSETS_DIR, 'data-registry-settings.json');
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Helper function to save VCT Builder / Data Registry settings
async function saveDataRegistrySettings(settings) {
  const settingsPath = path.join(ASSETS_DIR, 'data-registry-settings.json');
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
}

// GitHub repo configuration
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'Canadian-Open-Property-Association';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'governance';
const VCT_FOLDER_PATH = process.env.VCT_FOLDER_PATH || 'credentials/vct';
const SCHEMA_FOLDER_PATH = process.env.SCHEMA_FOLDER_PATH || 'credentials/schemas';
const CONTEXT_FOLDER_PATH = process.env.CONTEXT_FOLDER_PATH || 'credentials/contexts';
const ENTITY_FOLDER_PATH = process.env.ENTITY_FOLDER_PATH || 'credentials/entities';
const VOCAB_FOLDER_PATH = process.env.VOCAB_FOLDER_PATH || 'credentials/contexts';
const HARMONIZATION_FOLDER_PATH = process.env.HARMONIZATION_FOLDER_PATH || 'credentials/harmonization';
const BASE_URL = process.env.BASE_URL || 'https://openpropertyassociation.ca';
// Base branch for PRs - if set, use this instead of repo's default branch
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || null;

// Get configuration (base URLs and paths for VCT, Schema, Context, Entities, Vocab, and Harmonization)
router.get('/config', requireAuth, async (req, res) => {
  try {
    // Check for saved settings
    const savedSettings = await getDataRegistrySettings();

    // Return both base URLs and configurable paths
    res.json({
      // Base URLs for constructing full URIs
      vctBaseUrl: `${BASE_URL}/${VCT_FOLDER_PATH}/`,
      schemaBaseUrl: `${BASE_URL}/${SCHEMA_FOLDER_PATH}/`,
      contextBaseUrl: `${BASE_URL}/${CONTEXT_FOLDER_PATH}/`,
      entityBaseUrl: `${BASE_URL}/${ENTITY_FOLDER_PATH}/`,
      vocabBaseUrl: `${BASE_URL}/${VOCAB_FOLDER_PATH}/`,
      harmonizationBaseUrl: `${BASE_URL}/${HARMONIZATION_FOLDER_PATH}/`,
      // Configurable paths (from saved settings or defaults)
      schemaPath: savedSettings?.schemaPath || SCHEMA_FOLDER_PATH,
      vctPath: savedSettings?.vctPath || VCT_FOLDER_PATH,
      contextPath: savedSettings?.contextPath || CONTEXT_FOLDER_PATH,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update configuration (save data registry paths)
router.put('/config', requireAuth, async (req, res) => {
  try {
    const { schemaPath, vctPath, contextPath } = req.body;

    // Validate input
    if (!schemaPath && !vctPath && !contextPath) {
      return res.status(400).json({ error: 'At least one path setting is required' });
    }

    // Get existing settings or create new
    const existingSettings = await getDataRegistrySettings() || {};

    // Merge new settings
    const newSettings = {
      ...existingSettings,
      ...(schemaPath && { schemaPath }),
      ...(vctPath && { vctPath }),
      ...(contextPath && { contextPath }),
      updatedAt: new Date().toISOString(),
    };

    await saveDataRegistrySettings(newSettings);

    res.json({
      success: true,
      settings: newSettings,
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// List schema files from the repository
router.get('/schema-library', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);

    // Get contents of the schemas folder (from configured branch if set)
    const { data: contents } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: SCHEMA_FOLDER_PATH,
      ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
    });

    // Filter for JSON files only
    const schemaFiles = contents
      .filter((file) => file.type === 'file' && file.name.endsWith('.json'))
      .map((file) => ({
        name: file.name,
        path: file.path,
        sha: file.sha,
        download_url: file.download_url,
        uri: `${BASE_URL}/${file.path}`,
      }));

    res.json(schemaFiles);
  } catch (error) {
    if (error.status === 404) {
      // Folder doesn't exist or is empty
      return res.json([]);
    }
    console.error('Error fetching schema library:', error);
    res.status(500).json({ error: 'Failed to fetch schema library' });
  }
});

// Check if VCT filename is available
router.get('/vct-available/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const octokit = getOctokit(req);

    // Ensure filename ends with .json
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    try {
      await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: `${VCT_FOLDER_PATH}/${finalFilename}`,
        ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
      });
      // File exists, so it's not available
      res.json({ available: false, filename: finalFilename });
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist, so it's available
        res.json({ available: true, filename: finalFilename });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error checking VCT availability:', error);
    res.status(500).json({ error: 'Failed to check VCT availability' });
  }
});

// List VCT files from the repository
// Uses Forms Builder settings for path if available, otherwise falls back to env var or default
router.get('/vct-library', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);

    // Check for path override from Forms Builder settings
    const settings = await getFormsBuilderSettings();
    const folderPath = settings?.credentialRegistryPath || VCT_FOLDER_PATH;

    // Get contents of the VCT folder (from configured branch if set)
    const { data: contents } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: folderPath,
      ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
    });

    // Filter for JSON files only
    const vctFiles = contents
      .filter((file) => file.type === 'file' && file.name.endsWith('.json'))
      .map((file) => ({
        name: file.name,
        path: file.path,
        sha: file.sha,
        download_url: file.download_url,
      }));

    res.json(vctFiles);
  } catch (error) {
    if (error.status === 404) {
      // Folder doesn't exist or is empty
      return res.json([]);
    }
    console.error('Error fetching VCT library:', error);
    res.status(500).json({ error: 'Failed to fetch VCT library' });
  }
});

// Get a specific VCT file content
// Uses Forms Builder settings for path if available
router.get('/vct/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const octokit = getOctokit(req);

    // Check for path override from Forms Builder settings
    const settings = await getFormsBuilderSettings();
    const folderPath = settings?.credentialRegistryPath || VCT_FOLDER_PATH;

    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: `${folderPath}/${filename}`,
      ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const vct = JSON.parse(content);

    res.json({
      filename: data.name,
      sha: data.sha,
      content: vct,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'VCT file not found' });
    }
    console.error('Error fetching VCT file:', error);
    res.status(500).json({ error: 'Failed to fetch VCT file' });
  }
});

// Create a new Schema file (creates branch + PR)
// Supports both JSON Schema (.json) and JSON-LD Context (.jsonld) modes
router.post('/schema', requireAuth, async (req, res) => {
  try {
    const { filename, content, title, description, mode } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // Determine folder and file extension based on mode
    const isJsonLdMode = mode === 'jsonld-context';
    const extension = isJsonLdMode ? '.jsonld' : '.json';
    const folderPath = isJsonLdMode ? CONTEXT_FOLDER_PATH : SCHEMA_FOLDER_PATH;
    const typeLabel = isJsonLdMode ? 'JSON-LD Context' : 'JSON Schema';
    const branchPrefix = isJsonLdMode ? 'context' : 'schema';

    // Ensure filename ends with correct extension
    let finalFilename = filename;
    if (isJsonLdMode && !filename.endsWith('.jsonld')) {
      finalFilename = filename.replace(/\.json$/, '') + '.jsonld';
    } else if (!isJsonLdMode && !filename.endsWith('.json')) {
      finalFilename = filename + '.json';
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `${branchPrefix}/add-${finalFilename.replace(/\.(json|jsonld)$/, '')}-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Create or update the file in the new branch
    const filePath = `${folderPath}/${finalFilename}`;
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: `Add ${typeLabel}: ${finalFilename}`,
      content: encodedContent,
      branch: branchName,
    });

    // Create a pull request
    const prTitle = title || `Add ${typeLabel}: ${finalFilename}`;
    const prBody = description || `This PR adds a new ${typeLabel} file: \`${finalFilename}\`

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      uri: `${BASE_URL}/${filePath}`,
    });
  } catch (error) {
    console.error('Error creating Schema PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create Schema pull request' });
  }
});

// Create a new VCT file (creates branch + PR)
router.post('/vct', requireAuth, async (req, res) => {
  try {
    const { filename, content, title, description } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // Ensure filename ends with .json
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      // Fall back to repo's default branch if not configured
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `vct/add-${finalFilename.replace('.json', '')}-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Create or update the file in the new branch
    const filePath = `${VCT_FOLDER_PATH}/${finalFilename}`;
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: `Add VCT branding file: ${finalFilename}`,
      content: encodedContent,
      branch: branchName,
    });

    // Create a pull request
    const prTitle = title || `Add VCT branding file: ${finalFilename}`;
    const prBody = description || `This PR adds a new VCT branding file: \`${finalFilename}\`

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
    });
  } catch (error) {
    console.error('Error creating VCT PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create VCT pull request' });
  }
});

// ============================================
// Entity Management Endpoints
// ============================================

// List entities from the repository
router.get('/entity-library', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);

    // Get entities.json from the entities folder
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: `${ENTITY_FOLDER_PATH}/entities.json`,
      ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const entityData = JSON.parse(content);

    res.json(entityData.entities || []);
  } catch (error) {
    if (error.status === 404) {
      // File doesn't exist yet
      return res.json([]);
    }
    console.error('Error fetching entity library:', error);
    res.status(500).json({ error: 'Failed to fetch entity library' });
  }
});

// Get entity file metadata (for checking if it exists)
router.get('/entity-available', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);

    try {
      await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: `${ENTITY_FOLDER_PATH}/entities.json`,
        ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
      });
      res.json({ exists: true });
    } catch (error) {
      if (error.status === 404) {
        res.json({ exists: false });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error checking entity availability:', error);
    res.status(500).json({ error: 'Failed to check entity availability' });
  }
});

// Save entities to repository (creates branch + PR)
router.post('/entity', requireAuth, async (req, res) => {
  try {
    const { content, title, description } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `entity/update-entities-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Check if file exists to get its SHA for update
    let existingSha = null;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: `${ENTITY_FOLDER_PATH}/entities.json`,
        ref: baseBranch,
      });
      existingSha = existingFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine - we'll create it
    }

    // Create or update the file in the new branch
    const filePath = `${ENTITY_FOLDER_PATH}/entities.json`;
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: title || 'Update entity registry',
      content: encodedContent,
      branch: branchName,
      ...(existingSha && { sha: existingSha }),
    });

    // Create a pull request
    const prTitle = title || 'Update entity registry';
    const prBody = description || `This PR updates the entity registry.

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      uri: `${BASE_URL}/${filePath}`,
    });
  } catch (error) {
    console.error('Error creating Entity PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create Entity pull request' });
  }
});

// Upload entity logo to repository (creates branch + PR)
router.post('/entity-logo', requireAuth, async (req, res) => {
  try {
    const { entityId, filename, content, title, description } = req.body;

    if (!entityId || !filename || !content) {
      return res.status(400).json({ error: 'entityId, filename, and content are required' });
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `entity/add-logo-${entityId}-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Create the logo file in the new branch
    const filePath = `${ENTITY_FOLDER_PATH}/logos/${filename}`;
    // Content should already be base64 encoded from the client
    const encodedContent = content.replace(/^data:image\/\w+;base64,/, '');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: `Add logo for entity: ${entityId}`,
      content: encodedContent,
      branch: branchName,
    });

    // Create a pull request
    const prTitle = title || `Add logo for entity: ${entityId}`;
    const prBody = description || `This PR adds a logo for the entity \`${entityId}\`.

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      logoUri: `${ENTITY_FOLDER_PATH}/logos/${filename}`,
    });
  } catch (error) {
    console.error('Error uploading entity logo:', error);
    res.status(500).json({ error: error.message || 'Failed to upload entity logo' });
  }
});

// Publish individual entity statement to repository (creates branch + PR)
// Creates a JSON file at credentials/entities/{entityId}.json
router.post('/entity-statement', requireAuth, async (req, res) => {
  try {
    const { entityId, entity, title, description } = req.body;

    if (!entityId || !entity) {
      return res.status(400).json({ error: 'entityId and entity are required' });
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `entity/publish-${entityId}-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Check if file exists to get its SHA for update
    const filePath = `${ENTITY_FOLDER_PATH}/${entityId}.json`;
    let existingSha = null;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: filePath,
        ref: baseBranch,
      });
      existingSha = existingFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine - we'll create it
    }

    // Prepare entity statement content
    // Structure follows entity statement format for publishing
    const entityStatement = {
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      entityTypes: entity.entityTypes || [],
      dataProviderTypes: entity.dataProviderTypes || undefined,
      serviceProviderTypes: entity.serviceProviderTypes || undefined,
      regionsCovered: entity.regionsCovered || undefined,
      status: entity.status,
      // Visual identity
      logoUri: entity.logoUri
        ? entity.logoUri.startsWith('http') || entity.logoUri.startsWith('/')
          ? entity.logoUri
          : `${ENTITY_FOLDER_PATH}/logos/${entity.logoUri}`
        : undefined,
      primaryColor: entity.primaryColor || undefined,
      // Contact & web
      website: entity.website || undefined,
      contactEmail: entity.contactEmail || undefined,
      contactPhone: entity.contactPhone || undefined,
      contactName: entity.contactName || undefined,
      // Technical identity
      did: entity.did || undefined,
      // Metadata
      publishedAt: new Date().toISOString(),
      publishedBy: {
        id: String(user.id),
        login: user.login,
        name: user.name || undefined,
      },
    };

    // Remove undefined fields
    Object.keys(entityStatement).forEach((key) => {
      if (entityStatement[key] === undefined) {
        delete entityStatement[key];
      }
    });

    const fileContent = JSON.stringify(entityStatement, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    const isUpdate = existingSha !== null;
    const commitMessage = isUpdate
      ? `Update entity statement: ${entity.name}`
      : `Add entity statement: ${entity.name}`;

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: commitMessage,
      content: encodedContent,
      branch: branchName,
      ...(existingSha && { sha: existingSha }),
    });

    // Create a pull request
    const prTitle = title || (isUpdate ? `Update entity: ${entity.name}` : `Add entity: ${entity.name}`);
    const prBody = description || `This PR ${isUpdate ? 'updates' : 'adds'} the entity statement for **${entity.name}** (\`${entityId}\`).

**Entity Types:** ${entity.entityTypes?.join(', ') || 'None'}
${entity.dataProviderTypes?.length ? `**Data Provider Types:** ${entity.dataProviderTypes.join(', ')}` : ''}
${entity.regionsCovered?.length ? `**Regions Covered:** ${entity.regionsCovered.join(', ')}` : ''}

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      uri: `${BASE_URL}/${filePath}`,
      isUpdate,
    });
  } catch (error) {
    console.error('Error creating entity statement PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create entity statement pull request' });
  }
});

// Check if entity statement file exists in the repository
router.get('/entity-statement/:entityId', requireAuth, async (req, res) => {
  try {
    const { entityId } = req.params;
    const octokit = getOctokit(req);

    const filePath = `${ENTITY_FOLDER_PATH}/${entityId}.json`;

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: filePath,
        ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
      });

      // Decode and return the content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const entityData = JSON.parse(content);

      res.json({
        exists: true,
        sha: data.sha,
        uri: `${BASE_URL}/${filePath}`,
        entity: entityData,
      });
    } catch (error) {
      if (error.status === 404) {
        res.json({ exists: false });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error checking entity statement:', error);
    res.status(500).json({ error: 'Failed to check entity statement' });
  }
});

// ============================================
// Vocabulary Management Endpoints
// ============================================

// Save vocabulary types to repository (creates branch + PR with multiple files)
router.post('/vocab', requireAuth, async (req, res) => {
  try {
    const { vocabTypes, title, description } = req.body;

    if (!vocabTypes || !Array.isArray(vocabTypes) || vocabTypes.length === 0) {
      return res.status(400).json({ error: 'vocabTypes array is required' });
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Get the tree of the base commit
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      commit_sha: baseSha,
    });

    // Create blobs for each vocab type file
    const treeItems = [];
    for (const vocabType of vocabTypes) {
      const fileContent = JSON.stringify(vocabType, null, 2);
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        content: fileContent,
        encoding: 'utf-8',
      });

      treeItems.push({
        path: `${VOCAB_FOLDER_PATH}/${vocabType.id}.json`,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Create a new tree with the new files
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      base_tree: baseCommit.tree.sha,
      tree: treeItems,
    });

    // Create the commit
    const typeCount = vocabTypes.length;
    const typeList = vocabTypes.map((vt) => vt.name).join(', ');
    const commitMessage =
      typeCount === 1
        ? `Add vocabulary type: ${vocabTypes[0].name}`
        : `Add ${typeCount} vocabulary types`;

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseSha],
    });

    // Create a new branch pointing to the new commit
    const timestamp = Date.now();
    const branchName = `vocab/add-${typeCount}-types-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: newCommit.sha,
    });

    // Create a pull request
    const prTitle = title || (typeCount === 1 ? `Add vocabulary type: ${vocabTypes[0].name}` : `Add ${typeCount} vocabulary types`);
    const prBody =
      description ||
      `This PR adds ${typeCount === 1 ? 'a vocabulary type' : `${typeCount} vocabulary types`} to the governance repository.

**Vocabulary types:**
${vocabTypes.map((vt) => `- \`${vt.id}\`: ${vt.name}`).join('\n')}

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      files: vocabTypes.map((vt) => `${VOCAB_FOLDER_PATH}/${vt.id}.json`),
    });
  } catch (error) {
    console.error('Error creating Vocab PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create vocabulary pull request' });
  }
});

// ============================================
// Harmonization Mappings Endpoints
// ============================================

// Save harmonization mappings to repository (creates branch + PR)
router.post('/harmonization', requireAuth, async (req, res) => {
  try {
    const { content, title, description } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const octokit = getOctokit(req);
    const user = req.session.user;

    // Determine the base branch for the PR
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repo } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repo.default_branch;
    }

    // Get the latest commit SHA of the base branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `harmonization/update-mappings-${timestamp}`;

    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Check if file exists to get its SHA for update
    let existingSha = null;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: `${HARMONIZATION_FOLDER_PATH}/mappings.json`,
        ref: baseBranch,
      });
      existingSha = existingFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine - we'll create it
    }

    // Create or update the file in the new branch
    const filePath = `${HARMONIZATION_FOLDER_PATH}/mappings.json`;
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: title || 'Update data harmonization mappings',
      content: encodedContent,
      branch: branchName,
      ...(existingSha && { sha: existingSha }),
    });

    // Create a pull request
    const prTitle = title || 'Update data harmonization mappings';
    const prBody = description || `This PR updates the data harmonization mappings.

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      uri: `${BASE_URL}/${filePath}`,
    });
  } catch (error) {
    console.error('Error creating Harmonization PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create harmonization pull request' });
  }
});

// ============================================
// Entity Diff Endpoint (for PR creation with diff view)
// ============================================

// Compare local entities with GitHub entities and return diff
router.post('/entity-diff', requireAuth, async (req, res) => {
  try {
    const { localEntities } = req.body;

    if (!localEntities || !Array.isArray(localEntities)) {
      return res.status(400).json({ error: 'localEntities array is required' });
    }

    const octokit = getOctokit(req);

    // Fetch remote entities from GitHub
    let remoteEntities = [];
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: `${ENTITY_FOLDER_PATH}/entities.json`,
        ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
      });

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const entityData = JSON.parse(content);
      remoteEntities = entityData.entities || [];
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist yet, that's fine - all local entities are "added"
    }

    // Create maps for comparison
    const remoteMap = new Map(remoteEntities.map(e => [e.id, e]));
    const localMap = new Map(localEntities.map(e => [e.id, e]));

    // Categorize entities
    const added = [];
    const modified = [];
    const unchanged = [];
    const deleted = [];

    // Check local entities against remote
    for (const localEntity of localEntities) {
      const remoteEntity = remoteMap.get(localEntity.id);
      if (!remoteEntity) {
        added.push({
          id: localEntity.id,
          name: localEntity.name,
          types: localEntity.types,
        });
      } else {
        // Compare entities - simple JSON string comparison
        const localStr = JSON.stringify(localEntity);
        const remoteStr = JSON.stringify(remoteEntity);
        if (localStr !== remoteStr) {
          modified.push({
            id: localEntity.id,
            name: localEntity.name,
            types: localEntity.types,
            changes: getEntityChanges(remoteEntity, localEntity),
          });
        } else {
          unchanged.push({
            id: localEntity.id,
            name: localEntity.name,
            types: localEntity.types,
          });
        }
      }
    }

    // Check for deleted entities (in remote but not local)
    for (const remoteEntity of remoteEntities) {
      if (!localMap.has(remoteEntity.id)) {
        deleted.push({
          id: remoteEntity.id,
          name: remoteEntity.name,
          types: remoteEntity.types,
        });
      }
    }

    res.json({
      added,
      modified,
      unchanged,
      deleted,
      summary: {
        addedCount: added.length,
        modifiedCount: modified.length,
        unchangedCount: unchanged.length,
        deletedCount: deleted.length,
        totalLocal: localEntities.length,
        totalRemote: remoteEntities.length,
      },
    });
  } catch (error) {
    console.error('Error computing entity diff:', error);
    res.status(500).json({ error: error.message || 'Failed to compute entity diff' });
  }
});

// Helper: Get human-readable changes between two entities
function getEntityChanges(remote, local) {
  const changes = [];

  // Simple field comparison
  const fieldsToCheck = ['name', 'description', 'website', 'contactEmail', 'contactPhone', 'contactName', 'did', 'status', 'logoUri'];
  for (const field of fieldsToCheck) {
    if (remote[field] !== local[field]) {
      changes.push(`${field} changed`);
    }
  }

  // Types comparison
  const remoteTypes = (remote.types || []).sort().join(',');
  const localTypes = (local.types || []).sort().join(',');
  if (remoteTypes !== localTypes) {
    changes.push('types changed');
  }

  // Data schema comparison (simplified)
  const remoteSourceCount = remote.dataSchema?.sources?.length || 0;
  const localSourceCount = local.dataSchema?.sources?.length || 0;
  if (remoteSourceCount !== localSourceCount) {
    changes.push(`data sources: ${remoteSourceCount} → ${localSourceCount}`);
  }

  return changes.length > 0 ? changes : ['content changed'];
}

// ============================================
// Simple Entities Endpoint (for Asset Manager)
// ============================================

// Get entities as simple array for dropdowns
router.get('/entities', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);

    // Get entities.json from the entities folder
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: `${ENTITY_FOLDER_PATH}/entities.json`,
      ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const entityData = JSON.parse(content);

    // Map to simple format for dropdowns
    const entities = (entityData.entities || []).map((entity) => ({
      id: entity.id,
      name: entity.name,
      types: entity.types || [],
      logoUri: entity.logoUri,
    }));

    res.json(entities);
  } catch (error) {
    if (error.status === 404) {
      // File doesn't exist yet
      return res.json([]);
    }
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

// ============================================
// Published Assets Endpoints (fetching from VDR)
// ============================================

// List published assets from GitHub VDR (logos, backgrounds, icons)
router.get('/published-assets', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const assets = [];

    // Helper to fetch images from a folder
    const fetchFolder = async (folderPath, assetType) => {
      try {
        const { data: contents } = await octokit.rest.repos.getContent({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          path: folderPath,
          ...(GITHUB_BASE_BRANCH && { ref: GITHUB_BASE_BRANCH }),
        });

        // Filter for image files
        const imageFiles = contents.filter(
          (file) => file.type === 'file' && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file.name)
        );

        for (const file of imageFiles) {
          assets.push({
            id: `${assetType}:${file.name}`,
            name: file.name.replace(/\.[^.]+$/, ''),
            filename: file.name,
            type: assetType,
            uri: `${BASE_URL}/${file.path}`,
            downloadUrl: file.download_url,
            sha: file.sha,
          });
        }
      } catch (error) {
        if (error.status !== 404) {
          console.error(`Error fetching ${assetType} folder:`, error);
        }
        // Folder doesn't exist, that's fine
      }
    };

    // Fetch from all asset folders in parallel
    await Promise.all([
      fetchFolder(`${ENTITY_FOLDER_PATH}/logos`, 'entity-logo'),
      fetchFolder(`${VCT_FOLDER_PATH}/backgrounds`, 'credential-background'),
      fetchFolder(`${VCT_FOLDER_PATH}/icons`, 'credential-icon'),
    ]);

    res.json(assets);
  } catch (error) {
    console.error('Error fetching published assets:', error);
    res.status(500).json({ error: 'Failed to fetch published assets' });
  }
});

// ============================================
// Asset Publishing (images to GitHub VDR)
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename_gh = fileURLToPath(import.meta.url);
const __dirname_gh = path.dirname(__filename_gh);
const ASSETS_DIR_GH = process.env.ASSETS_PATH || path.join(__dirname_gh, '../assets');

// Asset type to GitHub path mapping
const ASSET_TYPE_PATHS = {
  'entity-logo': `${ENTITY_FOLDER_PATH}/logos`,
  'credential-background': `${VCT_FOLDER_PATH}/backgrounds`,
  'credential-icon': `${VCT_FOLDER_PATH}/icons`,
};

// Create PR to publish an asset to GitHub VDR
router.post('/asset', requireAuth, async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const user = req.session.user;
    const { filename, localUri, assetType, entityId, name, title, description } = req.body;

    if (!filename || !localUri || !assetType) {
      return res.status(400).json({ error: 'filename, localUri, and assetType are required' });
    }

    if (!ASSET_TYPE_PATHS[assetType]) {
      return res.status(400).json({ error: `Invalid assetType: ${assetType}` });
    }

    // Read the local file
    const localFilePath = path.join(ASSETS_DIR_GH, filename);
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ error: 'Local asset file not found' });
    }

    const fileContent = fs.readFileSync(localFilePath);
    const encodedContent = fileContent.toString('base64');
    const ext = path.extname(filename);

    // Determine target filename based on asset type
    let targetFilename;
    if (assetType === 'entity-logo') {
      if (!entityId) {
        return res.status(400).json({ error: 'entityId is required for entity-logo type' });
      }
      targetFilename = `${entityId}${ext}`;
    } else {
      // For backgrounds and icons, use sanitized name
      const safeName = (name || filename.replace(ext, '')).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      targetFilename = `${safeName}${ext}`;
    }

    const folderPath = ASSET_TYPE_PATHS[assetType];
    const filePath = `${folderPath}/${targetFilename}`;

    // Get the default branch
    let baseBranch = GITHUB_BASE_BRANCH;
    if (!baseBranch) {
      const { data: repoData } = await octokit.rest.repos.get({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
      });
      baseBranch = repoData.default_branch;
    }

    // Get the base branch ref
    const { data: ref } = await octokit.rest.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `heads/${baseBranch}`,
    });

    // Create a unique branch for this PR
    const branchName = `asset/${assetType}/${targetFilename.replace(ext, '')}-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    // Check if file already exists
    let existingSha = null;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: filePath,
        ref: baseBranch,
      });
      existingSha = existingFile.sha;
    } catch {
      // File doesn't exist, that's fine
    }

    // Create or update the file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: filePath,
      message: title || `Add ${assetType}: ${targetFilename}`,
      content: encodedContent,
      branch: branchName,
      ...(existingSha && { sha: existingSha }),
    });

    // Create a pull request
    const prTitle = title || `Add ${assetType}: ${targetFilename}`;
    const assetTypeLabel = {
      'entity-logo': 'Entity Logo',
      'credential-background': 'Credential Background',
      'credential-icon': 'Credential Icon',
    }[assetType];
    const prBody = description || `This PR adds a new ${assetTypeLabel}: \`${targetFilename}\`

**Type:** ${assetTypeLabel}
**File:** \`${filePath}\`
${entityId ? `**Entity ID:** ${entityId}` : ''}

Created by @${user.login} using the [Cornerstone Network Apps](https://apps.openpropertyassociation.ca).`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: baseBranch,
    });

    res.json({
      success: true,
      pr: {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
      },
      branch: branchName,
      file: filePath,
      uri: `${BASE_URL}/${filePath}`,
    });
  } catch (error) {
    console.error('Error creating Asset PR:', error);
    res.status(500).json({ error: error.message || 'Failed to create asset pull request' });
  }
});

export default router;
