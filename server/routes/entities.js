import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get the data directory from environment or use default
const getDataDir = () => {
  const assetsPath = process.env.ASSETS_PATH || path.join(__dirname, '../../assets');
  const entitiesDir = path.join(assetsPath, 'entities');
  if (!fs.existsSync(entitiesDir)) {
    fs.mkdirSync(entitiesDir, { recursive: true });
  }
  return entitiesDir;
};

// Load seed data path
const getSeedDataPath = () => path.join(__dirname, '../data/seed-entities.json');

// Data file path
const getEntitiesFile = () => path.join(getDataDir(), 'entities.json');

// Initialize data files if they don't exist
const initializeData = () => {
  const entitiesFile = getEntitiesFile();

  if (!fs.existsSync(entitiesFile)) {
    const seedPath = getSeedDataPath();
    if (fs.existsSync(seedPath)) {
      console.log('Initializing entities from seed data...');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      const now = new Date().toISOString();

      const entities = (seedData.entities || []).map((e) => ({
        ...e,
        createdAt: e.createdAt || now,
        updatedAt: e.updatedAt || now,
      }));

      fs.writeFileSync(entitiesFile, JSON.stringify({ entities }, null, 2));
      console.log(`Entities initialized with ${entities.length} entities`);
    } else {
      // Create empty data file
      fs.writeFileSync(entitiesFile, JSON.stringify({ entities: [] }, null, 2));
    }
  }
};

// Migrate entity from old format to new entityTypes array format
const migrateEntityTypes = (entity) => {
  // If already has entityTypes array, return as-is
  if (Array.isArray(entity.entityTypes)) {
    return entity;
  }

  // Migrate from old formats
  let entityTypes = [];

  // Check for old 'types' array (from previous migration attempt)
  if (Array.isArray(entity.types) && entity.types.length > 0) {
    entityTypes = entity.types;
  }
  // Check for old 'entityType' single string
  else if (entity.entityType && typeof entity.entityType === 'string') {
    entityTypes = [entity.entityType];
  }
  // Check for very old 'type' single string
  else if (entity.type && typeof entity.type === 'string') {
    entityTypes = [entity.type];
  }

  // Return migrated entity (without old fields)
  const { types, type, entityType, ...rest } = entity;
  return {
    ...rest,
    entityTypes,
  };
};

// Load helpers
const loadEntities = () => {
  initializeData();
  const data = JSON.parse(fs.readFileSync(getEntitiesFile(), 'utf-8'));
  // Migrate all entities to new format on load
  return (data.entities || []).map(migrateEntityTypes);
};

const saveEntities = (entities) => {
  fs.writeFileSync(getEntitiesFile(), JSON.stringify({ entities }, null, 2));
};

// Middleware: Require authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ============================================
// Entities API
// ============================================

// List all entities (with optional type filter - supports multiple types)
router.get('/', (req, res) => {
  try {
    const { types, search } = req.query;
    let entities = loadEntities();

    // Filter by types if provided (comma-separated list)
    // Entity matches if it has ANY of the specified types
    if (types) {
      const typeList = types.split(',').map((t) => t.trim());
      entities = entities.filter((e) => {
        // Use migrated entityTypes array
        const entityTypes = e.entityTypes || [];
        return entityTypes.some((t) => typeList.includes(t));
      });
    }

    // Filter by search query if provided
    if (search && search.length >= 2) {
      const query = search.toLowerCase();
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
      );
    }

    res.json(entities);
  } catch (error) {
    console.error('Error listing entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single entity
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const entities = loadEntities();
    const entity = entities.find((e) => e.id === id);

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(entity);
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new entity
router.post('/', requireAuth, (req, res) => {
  try {
    const entities = loadEntities();
    const now = new Date().toISOString();

    // Generate slug-style ID from name with copa- prefix
    // Handles accented characters by converting them to their base form (é → e, etc.)
    const generateId = (name) => {
      const slug = name
        .toLowerCase()
        // Normalize to decompose accented characters (é → e + combining accent)
        .normalize('NFD')
        // Remove combining diacritical marks (the accents)
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return slug ? `copa-${slug}` : '';
    };

    // Handle entityTypes - accept array, or migrate from legacy entityType string
    let entityTypes = [];
    if (Array.isArray(req.body.entityTypes)) {
      entityTypes = req.body.entityTypes;
    } else if (req.body.entityType && typeof req.body.entityType === 'string') {
      entityTypes = [req.body.entityType];
    }

    const newEntity = {
      id: req.body.id || generateId(req.body.name),
      name: req.body.name,
      description: req.body.description || '',
      logoUri: req.body.logoUri || '',
      primaryColor: req.body.primaryColor || '',
      website: req.body.website || '',
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      contactName: req.body.contactName || '',
      did: req.body.did || '',
      regionsCovered: req.body.regionsCovered || [],
      dataProviderTypes: req.body.dataProviderTypes || [],
      serviceProviderTypes: req.body.serviceProviderTypes || [],
      entityTypes: entityTypes,
      dataSchema: req.body.dataSchema || undefined,
      status: req.body.status || 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    if (!newEntity.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate ID
    if (entities.some((e) => e.id === newEntity.id)) {
      return res.status(409).json({ error: 'Entity with this ID already exists' });
    }

    entities.push(newEntity);
    saveEntities(entities);

    res.json(newEntity);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an entity
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const entities = loadEntities();
    const index = entities.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Handle entityTypes - support new array format and legacy formats
    let newEntityTypes;
    if (Array.isArray(req.body.entityTypes)) {
      newEntityTypes = req.body.entityTypes;
    } else if (req.body.entityType && typeof req.body.entityType === 'string') {
      newEntityTypes = [req.body.entityType];
    } else {
      newEntityTypes = entities[index].entityTypes || [];
    }

    // Handle ID change if requested (newId is the slug part, without copa- prefix)
    let newEntityId = entities[index].id;
    if (req.body.newId !== undefined && req.body.newId !== null) {
      // Ensure the new ID has copa- prefix and is properly formatted
      // Handle accented characters by converting them to their base form
      const slug = req.body.newId
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      newEntityId = slug.startsWith('copa-') ? slug : `copa-${slug}`;

      // Check for duplicate ID (but allow if it's the same as current)
      if (newEntityId !== entities[index].id && entities.some((e) => e.id === newEntityId)) {
        return res.status(409).json({ error: 'Entity with this ID already exists' });
      }
    }

    const updatedEntity = {
      ...entities[index],
      id: newEntityId,
      name: req.body.name ?? entities[index].name,
      entityTypes: newEntityTypes,
      description: req.body.description ?? entities[index].description,
      logoUri: req.body.logoUri ?? entities[index].logoUri,
      primaryColor: req.body.primaryColor ?? entities[index].primaryColor,
      website: req.body.website ?? entities[index].website,
      contactEmail: req.body.contactEmail ?? entities[index].contactEmail,
      contactPhone: req.body.contactPhone ?? entities[index].contactPhone,
      contactName: req.body.contactName ?? entities[index].contactName,
      did: req.body.did ?? entities[index].did,
      regionsCovered: req.body.regionsCovered ?? entities[index].regionsCovered,
      dataProviderTypes: req.body.dataProviderTypes ?? entities[index].dataProviderTypes,
      serviceProviderTypes: req.body.serviceProviderTypes ?? entities[index].serviceProviderTypes,
      status: req.body.status ?? entities[index].status,
      dataSchema: req.body.dataSchema ?? entities[index].dataSchema,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    // Remove legacy fields if they exist
    delete updatedEntity.type;
    delete updatedEntity.types;
    delete updatedEntity.entityType;

    entities[index] = updatedEntity;
    saveEntities(entities);

    res.json(updatedEntity);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an entity
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const entities = loadEntities();

    const index = entities.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    entities.splice(index, 1);
    saveEntities(entities);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export all entities
router.get('/export', (req, res) => {
  try {
    const entities = loadEntities();
    res.json({
      exportedAt: new Date().toISOString(),
      entities,
    });
  } catch (error) {
    console.error('Error exporting entities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
