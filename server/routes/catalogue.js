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
  const catalogueDir = path.join(assetsPath, 'catalogue');
  if (!fs.existsSync(catalogueDir)) {
    fs.mkdirSync(catalogueDir, { recursive: true });
  }
  return catalogueDir;
};

// Load seed data if catalogue is empty
const getSeedDataPath = () => path.join(__dirname, '../data/seed-furnishers.json');
const getSeedDataTypeConfigsPath = () => path.join(__dirname, '../data/seed-data-type-configs.json');

// Data file paths
const getFurnishersFile = () => path.join(getDataDir(), 'furnishers.json');
const getDataTypesFile = () => path.join(getDataDir(), 'data-types.json');
const getAttributesFile = () => path.join(getDataDir(), 'attributes.json');
const getDataTypeConfigsFile = () => path.join(getDataDir(), 'data-type-configs.json');
const getCategoriesFile = () => path.join(getDataDir(), 'categories.json');

// Initialize data files if they don't exist
const initializeData = () => {
  const furnishersFile = getFurnishersFile();
  const dataTypesFile = getDataTypesFile();
  const attributesFile = getAttributesFile();

  // Check if we need to initialize from seed data
  if (!fs.existsSync(furnishersFile)) {
    const seedPath = getSeedDataPath();
    if (fs.existsSync(seedPath)) {
      console.log('Initializing catalogue from seed data...');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

      const furnishers = [];
      const dataTypes = [];
      const attributes = [];
      const now = new Date().toISOString();

      for (const f of seedData.furnishers) {
        // Create furnisher record
        furnishers.push({
          id: f.id,
          name: f.name,
          description: f.description || '',
          logoUri: f.logoUri || '',
          website: f.website || '',
          contactName: f.contactName || '',
          contactEmail: f.contactEmail || '',
          contactPhone: f.contactPhone || '',
          did: f.did || '',
          regionsCovered: f.regionsCovered || [],
          createdAt: now,
          updatedAt: now,
        });

        // Create data types and attributes
        for (const dt of f.dataTypes || []) {
          dataTypes.push({
            id: dt.id,
            furnisherId: f.id,
            name: dt.name,
            description: dt.description || '',
            createdAt: now,
            updatedAt: now,
          });

          for (const attr of dt.attributes || []) {
            attributes.push({
              id: `${dt.id}-${attr.name}`,
              dataTypeId: dt.id,
              name: attr.name,
              displayName: attr.displayName || attr.name,
              description: attr.description || '',
              dataType: attr.dataType || 'string',
              sampleValue: attr.sampleValue || '',
              regionsCovered: attr.regionsCovered || null,
              path: attr.path || '',
              metadata: attr.metadata || {},
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      // Save all data
      fs.writeFileSync(furnishersFile, JSON.stringify({ furnishers }, null, 2));
      fs.writeFileSync(dataTypesFile, JSON.stringify({ dataTypes }, null, 2));
      fs.writeFileSync(attributesFile, JSON.stringify({ attributes }, null, 2));

      console.log(`Catalogue initialized with ${furnishers.length} furnishers, ${dataTypes.length} data types, ${attributes.length} attributes`);
    } else {
      // Create empty data files
      fs.writeFileSync(furnishersFile, JSON.stringify({ furnishers: [] }, null, 2));
      fs.writeFileSync(dataTypesFile, JSON.stringify({ dataTypes: [] }, null, 2));
      fs.writeFileSync(attributesFile, JSON.stringify({ attributes: [] }, null, 2));
    }
  }
};

// Load helpers
const loadFurnishers = () => {
  initializeData();
  const data = JSON.parse(fs.readFileSync(getFurnishersFile(), 'utf-8'));
  return data.furnishers || [];
};

const saveFurnishers = (furnishers) => {
  fs.writeFileSync(getFurnishersFile(), JSON.stringify({ furnishers }, null, 2));
};

const loadDataTypes = () => {
  initializeData();
  const data = JSON.parse(fs.readFileSync(getDataTypesFile(), 'utf-8'));
  return data.dataTypes || [];
};

const saveDataTypes = (dataTypes) => {
  fs.writeFileSync(getDataTypesFile(), JSON.stringify({ dataTypes }, null, 2));
};

const loadAttributes = () => {
  initializeData();
  const data = JSON.parse(fs.readFileSync(getAttributesFile(), 'utf-8'));
  return data.attributes || [];
};

const saveAttributes = (attributes) => {
  fs.writeFileSync(getAttributesFile(), JSON.stringify({ attributes }, null, 2));
};

// Data Type Configs (standardized data type definitions)
const initializeDataTypeConfigs = () => {
  const configsFile = getDataTypeConfigsFile();
  const categoriesFile = getCategoriesFile();

  if (!fs.existsSync(configsFile)) {
    const seedPath = getSeedDataTypeConfigsPath();
    if (fs.existsSync(seedPath)) {
      console.log('Initializing data type configs from seed data...');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      fs.writeFileSync(configsFile, JSON.stringify({ dataTypeConfigs: seedData.dataTypeConfigs || [] }, null, 2));
      fs.writeFileSync(categoriesFile, JSON.stringify({ categories: seedData.categories || [] }, null, 2));
      console.log(`Data type configs initialized with ${seedData.dataTypeConfigs?.length || 0} configs`);
    } else {
      fs.writeFileSync(configsFile, JSON.stringify({ dataTypeConfigs: [] }, null, 2));
      fs.writeFileSync(categoriesFile, JSON.stringify({ categories: [] }, null, 2));
    }
  }
};

const loadDataTypeConfigs = () => {
  initializeDataTypeConfigs();
  const data = JSON.parse(fs.readFileSync(getDataTypeConfigsFile(), 'utf-8'));
  return data.dataTypeConfigs || [];
};

const saveDataTypeConfigs = (dataTypeConfigs) => {
  fs.writeFileSync(getDataTypeConfigsFile(), JSON.stringify({ dataTypeConfigs }, null, 2));
};

const loadCategories = () => {
  initializeDataTypeConfigs();
  const data = JSON.parse(fs.readFileSync(getCategoriesFile(), 'utf-8'));
  return data.categories || [];
};

const saveCategories = (categories) => {
  fs.writeFileSync(getCategoriesFile(), JSON.stringify({ categories }, null, 2));
};

// Middleware: Require authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ============================================
// Furnishers API
// ============================================

// List all furnishers with stats
router.get('/furnishers', (req, res) => {
  try {
    const furnishers = loadFurnishers();
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    // Add stats to each furnisher
    const furnishersWithStats = furnishers.map(f => {
      const fDataTypes = dataTypes.filter(dt => dt.furnisherId === f.id);
      const fDataTypeIds = fDataTypes.map(dt => dt.id);
      const fAttributes = attributes.filter(a => fDataTypeIds.includes(a.dataTypeId));

      return {
        ...f,
        stats: {
          dataTypeCount: fDataTypes.length,
          attributeCount: fAttributes.length,
        },
      };
    });

    res.json(furnishersWithStats);
  } catch (error) {
    console.error('Error listing furnishers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single furnisher with all data types and attributes
router.get('/furnishers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const furnishers = loadFurnishers();
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    const furnisher = furnishers.find(f => f.id === id);
    if (!furnisher) {
      return res.status(404).json({ error: 'Furnisher not found' });
    }

    // Get data types for this furnisher
    const fDataTypes = dataTypes.filter(dt => dt.furnisherId === id);

    // Add attributes to each data type
    const dataTypesWithAttributes = fDataTypes.map(dt => ({
      ...dt,
      attributes: attributes.filter(a => a.dataTypeId === dt.id),
    }));

    res.json({
      ...furnisher,
      dataTypes: dataTypesWithAttributes,
    });
  } catch (error) {
    console.error('Error getting furnisher:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new furnisher
router.post('/furnishers', requireAuth, (req, res) => {
  try {
    const furnishers = loadFurnishers();
    const now = new Date().toISOString();

    const newFurnisher = {
      id: req.body.id || `furnisher-${Date.now()}`,
      name: req.body.name,
      description: req.body.description || '',
      logoUri: req.body.logoUri || '',
      website: req.body.website || '',
      contactName: req.body.contactName || '',
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      did: req.body.did || '',
      regionsCovered: req.body.regionsCovered || [],
      createdAt: now,
      updatedAt: now,
      createdBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    if (!newFurnisher.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate ID
    if (furnishers.some(f => f.id === newFurnisher.id)) {
      return res.status(409).json({ error: 'Furnisher with this ID already exists' });
    }

    furnishers.push(newFurnisher);
    saveFurnishers(furnishers);

    res.json(newFurnisher);
  } catch (error) {
    console.error('Error creating furnisher:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a furnisher
router.put('/furnishers/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const furnishers = loadFurnishers();
    const index = furnishers.findIndex(f => f.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Furnisher not found' });
    }

    const updatedFurnisher = {
      ...furnishers[index],
      name: req.body.name ?? furnishers[index].name,
      description: req.body.description ?? furnishers[index].description,
      logoUri: req.body.logoUri ?? furnishers[index].logoUri,
      website: req.body.website ?? furnishers[index].website,
      contactName: req.body.contactName ?? furnishers[index].contactName,
      contactEmail: req.body.contactEmail ?? furnishers[index].contactEmail,
      contactPhone: req.body.contactPhone ?? furnishers[index].contactPhone,
      did: req.body.did ?? furnishers[index].did,
      regionsCovered: req.body.regionsCovered ?? furnishers[index].regionsCovered,
      updatedAt: new Date().toISOString(),
    };

    furnishers[index] = updatedFurnisher;
    saveFurnishers(furnishers);

    res.json(updatedFurnisher);
  } catch (error) {
    console.error('Error updating furnisher:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a furnisher (and all its data types and attributes)
router.delete('/furnishers/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const furnishers = loadFurnishers();
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    const index = furnishers.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Furnisher not found' });
    }

    // Get data type IDs for this furnisher
    const dataTypeIds = dataTypes.filter(dt => dt.furnisherId === id).map(dt => dt.id);

    // Remove furnisher
    furnishers.splice(index, 1);
    saveFurnishers(furnishers);

    // Remove data types
    const remainingDataTypes = dataTypes.filter(dt => dt.furnisherId !== id);
    saveDataTypes(remainingDataTypes);

    // Remove attributes
    const remainingAttributes = attributes.filter(a => !dataTypeIds.includes(a.dataTypeId));
    saveAttributes(remainingAttributes);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting furnisher:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Data Types API
// ============================================

// List data types for a furnisher
router.get('/furnishers/:furnisherId/data-types', (req, res) => {
  try {
    const { furnisherId } = req.params;
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    const fDataTypes = dataTypes.filter(dt => dt.furnisherId === furnisherId);

    // Add attribute count to each data type
    const dataTypesWithCount = fDataTypes.map(dt => ({
      ...dt,
      attributeCount: attributes.filter(a => a.dataTypeId === dt.id).length,
    }));

    res.json(dataTypesWithCount);
  } catch (error) {
    console.error('Error listing data types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a data type
router.post('/data-types', requireAuth, (req, res) => {
  try {
    const dataTypes = loadDataTypes();
    const now = new Date().toISOString();

    const newDataType = {
      id: req.body.id || `dt-${Date.now()}`,
      furnisherId: req.body.furnisherId,
      name: req.body.name,
      description: req.body.description || '',
      createdAt: now,
      updatedAt: now,
    };

    if (!newDataType.furnisherId || !newDataType.name) {
      return res.status(400).json({ error: 'furnisherId and name are required' });
    }

    // Check for duplicate ID
    if (dataTypes.some(dt => dt.id === newDataType.id)) {
      return res.status(409).json({ error: 'Data type with this ID already exists' });
    }

    dataTypes.push(newDataType);
    saveDataTypes(dataTypes);

    res.json(newDataType);
  } catch (error) {
    console.error('Error creating data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a data type
router.put('/data-types/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const dataTypes = loadDataTypes();
    const index = dataTypes.findIndex(dt => dt.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const updatedDataType = {
      ...dataTypes[index],
      name: req.body.name ?? dataTypes[index].name,
      description: req.body.description ?? dataTypes[index].description,
      updatedAt: new Date().toISOString(),
    };

    dataTypes[index] = updatedDataType;
    saveDataTypes(dataTypes);

    res.json(updatedDataType);
  } catch (error) {
    console.error('Error updating data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a data type (and all its attributes)
router.delete('/data-types/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    const index = dataTypes.findIndex(dt => dt.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    // Remove data type
    dataTypes.splice(index, 1);
    saveDataTypes(dataTypes);

    // Remove attributes
    const remainingAttributes = attributes.filter(a => a.dataTypeId !== id);
    saveAttributes(remainingAttributes);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Attributes API
// ============================================

// List attributes for a data type
router.get('/data-types/:dataTypeId/attributes', (req, res) => {
  try {
    const { dataTypeId } = req.params;
    const attributes = loadAttributes();
    const dtAttributes = attributes.filter(a => a.dataTypeId === dataTypeId);
    res.json(dtAttributes);
  } catch (error) {
    console.error('Error listing attributes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single attribute
router.get('/attributes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const attributes = loadAttributes();
    const attribute = attributes.find(a => a.id === id);

    if (!attribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    res.json(attribute);
  } catch (error) {
    console.error('Error getting attribute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create an attribute
router.post('/attributes', requireAuth, (req, res) => {
  try {
    const attributes = loadAttributes();
    const now = new Date().toISOString();

    const newAttribute = {
      id: req.body.id || `attr-${Date.now()}`,
      dataTypeId: req.body.dataTypeId,
      name: req.body.name,
      displayName: req.body.displayName || req.body.name,
      description: req.body.description || '',
      dataType: req.body.dataType || 'string',
      sampleValue: req.body.sampleValue || '',
      regionsCovered: req.body.regionsCovered || null,
      path: req.body.path || '',
      metadata: req.body.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    if (!newAttribute.dataTypeId || !newAttribute.name) {
      return res.status(400).json({ error: 'dataTypeId and name are required' });
    }

    // Check for duplicate ID
    if (attributes.some(a => a.id === newAttribute.id)) {
      return res.status(409).json({ error: 'Attribute with this ID already exists' });
    }

    attributes.push(newAttribute);
    saveAttributes(attributes);

    res.json(newAttribute);
  } catch (error) {
    console.error('Error creating attribute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk create attributes
router.post('/attributes/bulk', requireAuth, (req, res) => {
  try {
    const { dataTypeId, attributes: newAttrs } = req.body;

    if (!dataTypeId || !Array.isArray(newAttrs) || newAttrs.length === 0) {
      return res.status(400).json({ error: 'dataTypeId and attributes array are required' });
    }

    const attributes = loadAttributes();
    const now = new Date().toISOString();
    const created = [];

    for (const attr of newAttrs) {
      const newAttribute = {
        id: attr.id || `attr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        dataTypeId,
        name: attr.name,
        displayName: attr.displayName || attr.name,
        description: attr.description || '',
        dataType: attr.dataType || 'string',
        sampleValue: attr.sampleValue || '',
        regionsCovered: attr.regionsCovered || null,
        path: attr.path || '',
        metadata: attr.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      if (!newAttribute.name) {
        continue; // Skip attributes without names
      }

      // Skip duplicates
      if (attributes.some(a => a.id === newAttribute.id)) {
        continue;
      }

      attributes.push(newAttribute);
      created.push(newAttribute);
    }

    saveAttributes(attributes);

    res.json({ created: created.length, attributes: created });
  } catch (error) {
    console.error('Error bulk creating attributes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an attribute
router.put('/attributes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const attributes = loadAttributes();
    const index = attributes.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    const updatedAttribute = {
      ...attributes[index],
      name: req.body.name ?? attributes[index].name,
      displayName: req.body.displayName ?? attributes[index].displayName,
      description: req.body.description ?? attributes[index].description,
      dataType: req.body.dataType ?? attributes[index].dataType,
      sampleValue: req.body.sampleValue ?? attributes[index].sampleValue,
      regionsCovered: req.body.regionsCovered !== undefined ? req.body.regionsCovered : attributes[index].regionsCovered,
      path: req.body.path ?? attributes[index].path,
      metadata: req.body.metadata ?? attributes[index].metadata,
      updatedAt: new Date().toISOString(),
    };

    attributes[index] = updatedAttribute;
    saveAttributes(attributes);

    res.json(updatedAttribute);
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an attribute
router.delete('/attributes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const attributes = loadAttributes();

    const index = attributes.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    attributes.splice(index, 1);
    saveAttributes(attributes);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Search API
// ============================================

// Search across all entities
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ furnishers: [], dataTypes: [], attributes: [] });
    }

    const query = q.toLowerCase();
    const furnishers = loadFurnishers();
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    const matchedFurnishers = furnishers.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.description?.toLowerCase().includes(query)
    );

    const matchedDataTypes = dataTypes.filter(dt =>
      dt.name.toLowerCase().includes(query) ||
      dt.description?.toLowerCase().includes(query)
    );

    const matchedAttributes = attributes.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.displayName?.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query)
    ).map(a => {
      // Add furnisherId to attribute for navigation
      const dataType = dataTypes.find(dt => dt.id === a.dataTypeId);
      return {
        ...a,
        furnisherId: dataType?.furnisherId,
      };
    });

    res.json({
      furnishers: matchedFurnishers,
      dataTypes: matchedDataTypes,
      attributes: matchedAttributes,
    });
  } catch (error) {
    console.error('Error searching catalogue:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Data Type Configs API (Standardized Types)
// ============================================

// List all data type configs with categories
router.get('/data-type-configs', (req, res) => {
  try {
    const configs = loadDataTypeConfigs();
    const categories = loadCategories();
    res.json({ configs, categories });
  } catch (error) {
    console.error('Error loading data type configs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single data type config
router.get('/data-type-configs/:id', (req, res) => {
  try {
    const configs = loadDataTypeConfigs();
    const config = configs.find(c => c.id === req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Data type config not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error loading data type config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new data type config
router.post('/data-type-configs', requireAuth, (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const configs = loadDataTypeConfigs();

    // Check for duplicate name
    if (configs.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ error: 'A data type config with this name already exists' });
    }

    const now = new Date().toISOString();
    const newConfig = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'Other',
      createdAt: now,
      updatedAt: now,
    };

    // Ensure unique ID
    let uniqueId = newConfig.id;
    let counter = 1;
    while (configs.some(c => c.id === uniqueId)) {
      uniqueId = `${newConfig.id}-${counter}`;
      counter++;
    }
    newConfig.id = uniqueId;

    configs.push(newConfig);
    saveDataTypeConfigs(configs);

    res.status(201).json(newConfig);
  } catch (error) {
    console.error('Error creating data type config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a data type config
router.put('/data-type-configs/:id', requireAuth, (req, res) => {
  try {
    const { name, description, category } = req.body;
    const configs = loadDataTypeConfigs();
    const index = configs.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type config not found' });
    }

    // Check for duplicate name (excluding self)
    if (name && configs.some(c => c.id !== req.params.id && c.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ error: 'A data type config with this name already exists' });
    }

    configs[index] = {
      ...configs[index],
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(category && { category }),
      updatedAt: new Date().toISOString(),
    };

    saveDataTypeConfigs(configs);
    res.json(configs[index]);
  } catch (error) {
    console.error('Error updating data type config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a data type config
router.delete('/data-type-configs/:id', requireAuth, (req, res) => {
  try {
    const configs = loadDataTypeConfigs();
    const index = configs.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type config not found' });
    }

    // Check if any data types are using this config
    const dataTypes = loadDataTypes();
    const inUse = dataTypes.filter(dt => dt.configId === req.params.id);
    if (inUse.length > 0) {
      return res.status(400).json({
        error: `This data type config is in use by ${inUse.length} data type(s). Remove references first.`,
      });
    }

    configs.splice(index, 1);
    saveDataTypeConfigs(configs);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting data type config:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Categories API
// ============================================

// List all categories
router.get('/categories', (req, res) => {
  try {
    const categories = loadCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new category
router.post('/categories', requireAuth, (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const categories = loadCategories();

    if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ error: 'This category already exists' });
    }

    const maxOrder = Math.max(0, ...categories.map(c => c.order || 0));
    const newCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name.trim(),
      order: maxOrder + 1,
    };

    categories.push(newCategory);
    saveCategories(categories);

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Export API
// ============================================

// Export all data
router.get('/export', (req, res) => {
  try {
    const furnishers = loadFurnishers();
    const dataTypes = loadDataTypes();
    const attributes = loadAttributes();

    // Build hierarchical export structure
    const exportData = {
      exportedAt: new Date().toISOString(),
      furnishers: furnishers.map(f => {
        const fDataTypes = dataTypes.filter(dt => dt.furnisherId === f.id);
        return {
          ...f,
          dataTypes: fDataTypes.map(dt => ({
            ...dt,
            attributes: attributes.filter(a => a.dataTypeId === dt.id),
          })),
        };
      }),
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting catalogue:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// V2 API - Vocabulary-First Design
// DataTypes are the primary concept, with properties and sources
// ============================================

// Data file path for vocabulary-first data types
const getV2DataTypesFile = () => path.join(getDataDir(), 'v2-data-types.json');
const getV2SeedDataPath = () => path.join(__dirname, '../data/v2-data-types.json');

// Initialize v2 data if it doesn't exist
const initializeV2Data = () => {
  const v2File = getV2DataTypesFile();
  if (!fs.existsSync(v2File)) {
    const seedPath = getV2SeedDataPath();
    if (fs.existsSync(seedPath)) {
      console.log('Initializing v2 data types from seed data...');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      fs.writeFileSync(v2File, JSON.stringify(seedData, null, 2));
      console.log(`V2 data types initialized with ${seedData.dataTypes?.length || 0} data types`);
    } else {
      fs.writeFileSync(v2File, JSON.stringify({ dataTypes: [] }, null, 2));
    }
  }
};

// Load/Save v2 data types
const loadV2DataTypes = () => {
  initializeV2Data();
  const data = JSON.parse(fs.readFileSync(getV2DataTypesFile(), 'utf-8'));
  return data.dataTypes || [];
};

const saveV2DataTypes = (dataTypes) => {
  fs.writeFileSync(getV2DataTypesFile(), JSON.stringify({ dataTypes }, null, 2));
};

// Generate slug-style ID
const generateV2Id = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// -------------------- V2 Data Types --------------------

// List all data types (vocabulary-first)
router.get('/v2/data-types', (req, res) => {
  try {
    const { category, search } = req.query;
    let dataTypes = loadV2DataTypes();

    // Filter by category
    if (category) {
      dataTypes = dataTypes.filter(dt => dt.category === category);
    }

    // Filter by search query
    if (search && search.length >= 2) {
      const query = search.toLowerCase();
      dataTypes = dataTypes.filter(dt =>
        dt.name.toLowerCase().includes(query) ||
        dt.description?.toLowerCase().includes(query)
      );
    }

    res.json(dataTypes);
  } catch (error) {
    console.error('Error listing v2 data types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single data type with properties and sources
router.get('/v2/data-types/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dataTypes = loadV2DataTypes();
    const dataType = dataTypes.find(dt => dt.id === id);

    if (!dataType) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    res.json(dataType);
  } catch (error) {
    console.error('Error getting v2 data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new data type
router.post('/v2/data-types', requireAuth, (req, res) => {
  try {
    const dataTypes = loadV2DataTypes();
    const now = new Date().toISOString();

    const newDataType = {
      id: req.body.id || generateV2Id(req.body.name),
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category || 'other',
      parentTypeId: req.body.parentTypeId || null,
      properties: req.body.properties || [],
      sources: req.body.sources || [],
      createdAt: now,
      updatedAt: now,
      createdBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    if (!newDataType.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate ID
    if (dataTypes.some(dt => dt.id === newDataType.id)) {
      return res.status(409).json({ error: 'Data type with this ID already exists' });
    }

    dataTypes.push(newDataType);
    saveV2DataTypes(dataTypes);

    res.json(newDataType);
  } catch (error) {
    console.error('Error creating v2 data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a data type
router.put('/v2/data-types/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const dataTypes = loadV2DataTypes();
    const index = dataTypes.findIndex(dt => dt.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const updatedDataType = {
      ...dataTypes[index],
      name: req.body.name ?? dataTypes[index].name,
      description: req.body.description ?? dataTypes[index].description,
      category: req.body.category ?? dataTypes[index].category,
      parentTypeId: req.body.parentTypeId !== undefined ? req.body.parentTypeId : dataTypes[index].parentTypeId,
      properties: req.body.properties ?? dataTypes[index].properties,
      sources: req.body.sources ?? dataTypes[index].sources,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    dataTypes[index] = updatedDataType;
    saveV2DataTypes(dataTypes);

    res.json(updatedDataType);
  } catch (error) {
    console.error('Error updating v2 data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a data type
router.delete('/v2/data-types/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const dataTypes = loadV2DataTypes();

    const index = dataTypes.findIndex(dt => dt.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    dataTypes.splice(index, 1);
    saveV2DataTypes(dataTypes);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting v2 data type:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Properties (nested in DataType) --------------------

// Add a property to a data type
router.post('/v2/data-types/:dataTypeId/properties', requireAuth, (req, res) => {
  try {
    const { dataTypeId } = req.params;
    const dataTypes = loadV2DataTypes();
    const index = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const property = {
      id: req.body.id || `prop-${Date.now()}`,
      name: req.body.name,
      displayName: req.body.displayName || req.body.name,
      description: req.body.description || '',
      valueType: req.body.valueType || 'string',
      required: req.body.required || false,
      sampleValue: req.body.sampleValue || '',
      path: req.body.path || '',
      metadata: req.body.metadata || {},
    };

    if (!property.name) {
      return res.status(400).json({ error: 'Property name is required' });
    }

    // Check for duplicate property name
    if (dataTypes[index].properties.some(p => p.name === property.name)) {
      return res.status(409).json({ error: 'Property with this name already exists' });
    }

    dataTypes[index].properties.push(property);
    dataTypes[index].updatedAt = new Date().toISOString();
    dataTypes[index].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[index]);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a property
router.put('/v2/data-types/:dataTypeId/properties/:propertyId', requireAuth, (req, res) => {
  try {
    const { dataTypeId, propertyId } = req.params;
    const dataTypes = loadV2DataTypes();
    const dtIndex = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (dtIndex === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const propIndex = dataTypes[dtIndex].properties.findIndex(p => p.id === propertyId);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    dataTypes[dtIndex].properties[propIndex] = {
      ...dataTypes[dtIndex].properties[propIndex],
      name: req.body.name ?? dataTypes[dtIndex].properties[propIndex].name,
      displayName: req.body.displayName ?? dataTypes[dtIndex].properties[propIndex].displayName,
      description: req.body.description ?? dataTypes[dtIndex].properties[propIndex].description,
      valueType: req.body.valueType ?? dataTypes[dtIndex].properties[propIndex].valueType,
      required: req.body.required ?? dataTypes[dtIndex].properties[propIndex].required,
      sampleValue: req.body.sampleValue ?? dataTypes[dtIndex].properties[propIndex].sampleValue,
      path: req.body.path ?? dataTypes[dtIndex].properties[propIndex].path,
      metadata: req.body.metadata ?? dataTypes[dtIndex].properties[propIndex].metadata,
    };

    dataTypes[dtIndex].updatedAt = new Date().toISOString();
    dataTypes[dtIndex].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[dtIndex]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a property
router.delete('/v2/data-types/:dataTypeId/properties/:propertyId', requireAuth, (req, res) => {
  try {
    const { dataTypeId, propertyId } = req.params;
    const dataTypes = loadV2DataTypes();
    const dtIndex = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (dtIndex === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const propIndex = dataTypes[dtIndex].properties.findIndex(p => p.id === propertyId);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    dataTypes[dtIndex].properties.splice(propIndex, 1);
    dataTypes[dtIndex].updatedAt = new Date().toISOString();
    dataTypes[dtIndex].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[dtIndex]);
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Sources (link to entities) --------------------

// Add a source (entity) to a data type
router.post('/v2/data-types/:dataTypeId/sources', requireAuth, (req, res) => {
  try {
    const { dataTypeId } = req.params;
    const dataTypes = loadV2DataTypes();
    const index = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (index === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const source = {
      entityId: req.body.entityId,
      entityName: req.body.entityName || '',
      regionsCovered: req.body.regionsCovered || [],
      updateFrequency: req.body.updateFrequency || '',
      notes: req.body.notes || '',
      apiEndpoint: req.body.apiEndpoint || '',
      addedAt: new Date().toISOString(),
      addedBy: {
        id: String(req.session.user.id),
        login: req.session.user.login,
        name: req.session.user.name || undefined,
      },
    };

    if (!source.entityId) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    // Check for duplicate source
    if (dataTypes[index].sources.some(s => s.entityId === source.entityId)) {
      return res.status(409).json({ error: 'This entity is already a source for this data type' });
    }

    dataTypes[index].sources.push(source);
    dataTypes[index].updatedAt = new Date().toISOString();
    dataTypes[index].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[index]);
  } catch (error) {
    console.error('Error adding source:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a source
router.put('/v2/data-types/:dataTypeId/sources/:entityId', requireAuth, (req, res) => {
  try {
    const { dataTypeId, entityId } = req.params;
    const dataTypes = loadV2DataTypes();
    const dtIndex = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (dtIndex === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const sourceIndex = dataTypes[dtIndex].sources.findIndex(s => s.entityId === entityId);
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }

    dataTypes[dtIndex].sources[sourceIndex] = {
      ...dataTypes[dtIndex].sources[sourceIndex],
      entityName: req.body.entityName ?? dataTypes[dtIndex].sources[sourceIndex].entityName,
      regionsCovered: req.body.regionsCovered ?? dataTypes[dtIndex].sources[sourceIndex].regionsCovered,
      updateFrequency: req.body.updateFrequency ?? dataTypes[dtIndex].sources[sourceIndex].updateFrequency,
      notes: req.body.notes ?? dataTypes[dtIndex].sources[sourceIndex].notes,
      apiEndpoint: req.body.apiEndpoint ?? dataTypes[dtIndex].sources[sourceIndex].apiEndpoint,
    };

    dataTypes[dtIndex].updatedAt = new Date().toISOString();
    dataTypes[dtIndex].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[dtIndex]);
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a source
router.delete('/v2/data-types/:dataTypeId/sources/:entityId', requireAuth, (req, res) => {
  try {
    const { dataTypeId, entityId } = req.params;
    const dataTypes = loadV2DataTypes();
    const dtIndex = dataTypes.findIndex(dt => dt.id === dataTypeId);

    if (dtIndex === -1) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    const sourceIndex = dataTypes[dtIndex].sources.findIndex(s => s.entityId === entityId);
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }

    dataTypes[dtIndex].sources.splice(sourceIndex, 1);
    dataTypes[dtIndex].updatedAt = new Date().toISOString();
    dataTypes[dtIndex].updatedBy = {
      id: String(req.session.user.id),
      login: req.session.user.login,
      name: req.session.user.name || undefined,
    };

    saveV2DataTypes(dataTypes);
    res.json(dataTypes[dtIndex]);
  } catch (error) {
    console.error('Error removing source:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Categories --------------------

// List all categories
router.get('/v2/categories', (req, res) => {
  try {
    const categories = loadCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error listing v2 categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new category
router.post('/v2/categories', requireAuth, (req, res) => {
  try {
    const { name, description, order } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const categories = loadCategories();

    if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const maxOrder = Math.max(0, ...categories.map(c => c.order || 0));
    const newCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name.trim(),
      description: description?.trim() || '',
      order: order ?? maxOrder + 1,
    };

    categories.push(newCategory);
    saveCategories(categories);

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating v2 category:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Search --------------------

// Search across data types and properties
router.get('/v2/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ dataTypes: [] });
    }

    const query = q.toLowerCase();
    const dataTypes = loadV2DataTypes();

    const matchedDataTypes = dataTypes.filter(dt =>
      dt.name.toLowerCase().includes(query) ||
      dt.description?.toLowerCase().includes(query) ||
      dt.properties.some(p =>
        p.name.toLowerCase().includes(query) ||
        p.displayName?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    );

    res.json({ dataTypes: matchedDataTypes });
  } catch (error) {
    console.error('Error searching v2 catalogue:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Export --------------------

// Export all v2 data
router.get('/v2/export', (req, res) => {
  try {
    const dataTypes = loadV2DataTypes();
    const categories = loadCategories();

    res.json({
      exportedAt: new Date().toISOString(),
      categories,
      dataTypes,
    });
  } catch (error) {
    console.error('Error exporting v2 catalogue:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- V2 Stats --------------------

// Get catalogue statistics
router.get('/v2/stats', (req, res) => {
  try {
    const dataTypes = loadV2DataTypes();
    const categories = loadCategories();

    const totalProperties = dataTypes.reduce((sum, dt) => sum + dt.properties.length, 0);
    const totalSources = dataTypes.reduce((sum, dt) => sum + dt.sources.length, 0);

    const categoryCounts = {};
    for (const dt of dataTypes) {
      const cat = dt.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    res.json({
      totalDataTypes: dataTypes.length,
      totalProperties,
      totalSources,
      totalCategories: categories.length,
      categoryCounts,
    });
  } catch (error) {
    console.error('Error getting v2 stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Admin API (for seeding new data)
// ============================================

// Migrate legacy data to v2 vocabulary-first structure
// This transforms furnisher-centric data to data-type-centric structure
router.post('/admin/migrate-to-v2', requireAuth, (req, res) => {
  try {
    const legacyDataTypes = loadDataTypes();
    const legacyAttributes = loadAttributes();
    const furnishers = loadFurnishers();
    const configs = loadDataTypeConfigs();
    const existingV2DataTypes = loadV2DataTypes();

    if (legacyDataTypes.length === 0) {
      return res.json({
        success: true,
        message: 'No legacy data to migrate',
        migrated: { dataTypes: 0, properties: 0, sources: 0 },
      });
    }

    const now = new Date().toISOString();
    const v2DataTypes = [...existingV2DataTypes];
    let migratedTypes = 0;
    let migratedProperties = 0;
    let migratedSources = 0;

    // Group legacy data types by configId (standardized type) or name
    const typeGroups = new Map();

    for (const ldt of legacyDataTypes) {
      // Use configId as the grouping key if available, otherwise use normalized name
      const groupKey = ldt.configId || ldt.name.toLowerCase().replace(/\s+/g, '-');

      if (!typeGroups.has(groupKey)) {
        typeGroups.set(groupKey, {
          name: ldt.name,
          configId: ldt.configId,
          description: ldt.description,
          furnisherDataTypes: [],
        });
      }

      typeGroups.get(groupKey).furnisherDataTypes.push(ldt);
    }

    // Convert grouped data to v2 format
    for (const [groupKey, group] of typeGroups) {
      // Skip if already exists in v2
      if (v2DataTypes.some(dt => dt.id === groupKey)) {
        console.log(`Skipping existing v2 data type: ${groupKey}`);
        continue;
      }

      // Get category from config if available
      const config = configs.find(c => c.id === group.configId);
      const category = config?.category?.toLowerCase().replace(/\s+/g, '-') || 'other';

      // Collect all attributes from all instances of this data type
      const allAttributes = [];
      const sources = [];

      for (const ldt of group.furnisherDataTypes) {
        // Get attributes for this data type
        const attrs = legacyAttributes.filter(a => a.dataTypeId === ldt.id);

        for (const attr of attrs) {
          // Check if this attribute already exists (by name)
          if (!allAttributes.some(a => a.name === attr.name)) {
            allAttributes.push(attr);
          }
        }

        // Get furnisher info for source
        const furnisher = furnishers.find(f => f.id === ldt.furnisherId);
        if (furnisher) {
          sources.push({
            entityId: furnisher.id,
            entityName: furnisher.name,
            regionsCovered: furnisher.regionsCovered || [],
            updateFrequency: '',
            notes: `Migrated from legacy data type: ${ldt.id}`,
            apiEndpoint: '',
            addedAt: now,
          });
          migratedSources++;
        }
      }

      // Convert attributes to properties
      const properties = allAttributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        displayName: attr.displayName || attr.name,
        description: attr.description || '',
        valueType: mapLegacyDataType(attr.dataType),
        required: false,
        sampleValue: attr.sampleValue || '',
        path: attr.path || '',
        metadata: attr.metadata || {},
      }));
      migratedProperties += properties.length;

      // Create v2 data type
      const v2DataType = {
        id: groupKey,
        name: group.name,
        description: group.description || config?.description || '',
        category,
        parentTypeId: null,
        properties,
        sources,
        createdAt: now,
        updatedAt: now,
        createdBy: {
          id: String(req.session.user.id),
          login: req.session.user.login,
          name: req.session.user.name || undefined,
        },
      };

      v2DataTypes.push(v2DataType);
      migratedTypes++;
    }

    // Save migrated data
    saveV2DataTypes(v2DataTypes);

    console.log(`Migration complete: ${migratedTypes} types, ${migratedProperties} properties, ${migratedSources} sources`);

    res.json({
      success: true,
      message: `Migration complete`,
      migrated: {
        dataTypes: migratedTypes,
        properties: migratedProperties,
        sources: migratedSources,
      },
      details: {
        dataTypes: v2DataTypes.slice(-migratedTypes).map(dt => ({
          id: dt.id,
          name: dt.name,
          propertyCount: dt.properties.length,
          sourceCount: dt.sources.length,
        })),
      },
    });
  } catch (error) {
    console.error('Error migrating to v2:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Map legacy data types to new property value types
function mapLegacyDataType(legacyType) {
  const mapping = {
    'string': 'string',
    'text': 'string',
    'number': 'number',
    'integer': 'number',
    'float': 'number',
    'decimal': 'number',
    'currency': 'currency',
    'boolean': 'boolean',
    'bool': 'boolean',
    'date': 'date',
    'datetime': 'datetime',
    'timestamp': 'datetime',
    'array': 'array',
    'object': 'object',
    'json': 'object',
    'url': 'url',
    'email': 'email',
    'phone': 'phone',
  };
  return mapping[legacyType?.toLowerCase()] || 'string';
}

// Sync seed data - adds new furnishers from seed without removing existing ones
router.post('/admin/sync-seed', (req, res) => {
  try {
    const { adminSecret } = req.body;

    // Verify admin secret
    const expectedSecret = process.env.ADMIN_SECRET || 'copa-admin-2024';
    if (adminSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    const seedPath = getSeedDataPath();
    if (!fs.existsSync(seedPath)) {
      return res.status(404).json({ error: 'Seed data file not found' });
    }

    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    const existingFurnishers = loadFurnishers();
    const existingDataTypes = loadDataTypes();
    const existingAttributes = loadAttributes();
    const now = new Date().toISOString();

    const addedFurnishers = [];
    const addedDataTypes = [];
    const addedAttributes = [];

    for (const f of seedData.furnishers) {
      // Skip if furnisher already exists
      if (existingFurnishers.some(ef => ef.id === f.id)) {
        console.log(`Skipping existing furnisher: ${f.id}`);
        continue;
      }

      // Add new furnisher
      const newFurnisher = {
        id: f.id,
        name: f.name,
        description: f.description || '',
        logoUri: f.logoUri || '',
        website: f.website || '',
        contactName: f.contactName || '',
        contactEmail: f.contactEmail || '',
        contactPhone: f.contactPhone || '',
        did: f.did || '',
        regionsCovered: f.regionsCovered || [],
        createdAt: now,
        updatedAt: now,
      };
      existingFurnishers.push(newFurnisher);
      addedFurnishers.push(newFurnisher);

      // Add data types and attributes
      for (const dt of f.dataTypes || []) {
        if (existingDataTypes.some(edt => edt.id === dt.id)) {
          console.log(`Skipping existing data type: ${dt.id}`);
          continue;
        }

        const newDataType = {
          id: dt.id,
          furnisherId: f.id,
          name: dt.name,
          description: dt.description || '',
          createdAt: now,
          updatedAt: now,
        };
        existingDataTypes.push(newDataType);
        addedDataTypes.push(newDataType);

        for (const attr of dt.attributes || []) {
          const attrId = `${dt.id}-${attr.name}`;
          if (existingAttributes.some(ea => ea.id === attrId)) {
            continue;
          }

          const newAttribute = {
            id: attrId,
            dataTypeId: dt.id,
            name: attr.name,
            displayName: attr.displayName || attr.name,
            description: attr.description || '',
            dataType: attr.dataType || 'string',
            sampleValue: attr.sampleValue || '',
            regionsCovered: attr.regionsCovered || null,
            path: attr.path || '',
            metadata: attr.metadata || {},
            createdAt: now,
            updatedAt: now,
          };
          existingAttributes.push(newAttribute);
          addedAttributes.push(newAttribute);
        }
      }
    }

    // Save updated data
    saveFurnishers(existingFurnishers);
    saveDataTypes(existingDataTypes);
    saveAttributes(existingAttributes);

    console.log(`Sync complete: ${addedFurnishers.length} furnishers, ${addedDataTypes.length} data types, ${addedAttributes.length} attributes added`);

    res.json({
      success: true,
      added: {
        furnishers: addedFurnishers.length,
        dataTypes: addedDataTypes.length,
        attributes: addedAttributes.length,
      },
      details: {
        furnishers: addedFurnishers.map(f => f.id),
        dataTypes: addedDataTypes.map(dt => dt.id),
      },
    });
  } catch (error) {
    console.error('Error syncing seed data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
