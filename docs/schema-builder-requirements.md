# Schema Builder Application - Requirements Document

## Overview

The Schema Builder is a new application within the Credential Design Tools platform that enables users to create JSON Schema files for verifiable credentials. It follows the same architectural patterns as the VCT Builder but focuses on schema definition rather than credential branding.

## Purpose

Create JSON Schema files (Draft 2020-12) that define the structure and validation rules for verifiable credentials in the COPA ecosystem. Each schema links to its corresponding credential governance documentation.

---

## User Flow

1. User logs into Credential Design Tools
2. Selects "Schema Builder" from the app selection page
3. **Left Panel**: Browses governance docs library OR creates schema from scratch
4. **Middle Panel**: Edits schema properties using tree-based UI
5. **Right Panel**: Views live JSON Schema output
6. Saves schema locally (to user's library)
7. Optionally creates PR to merge schema to governance repo

---

## UI Layout

### Three-Panel Layout (matches VCT Builder pattern)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Schema Builder (project name + save indicator *)    │
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [New] [Save] [Local Library] [Schema Library] [Create PR] │
├──────────────┬────────────────────────┬─────────────────────┤
│              │                        │                     │
│  LEFT PANEL  │     MIDDLE PANEL       │    RIGHT PANEL      │
│  (1/4 width) │     (1/2 width)        │    (1/4 width)      │
│              │                        │                     │
│  Governance  │   Schema Editor        │   JSON Preview      │
│  Docs List   │   (Tree View)          │   (Syntax          │
│              │                        │    Highlighted)     │
│  - Select    │   - Schema Metadata    │                     │
│    governance│   - Properties Tree    │   Copy button       │
│    doc to    │   - Add/Edit/Delete    │   Download button   │
│    link      │     properties         │                     │
│              │                        │                     │
└──────────────┴────────────────────────┴─────────────────────┘
```

### Left Panel: Governance Docs Library

- Fetches list from `credentials/governance-docs/` in governance repo
- Displays as selectable list (not for parsing, just for linking)
- When selected, sets the `x-governance-doc` metadata field
- Search/filter by name
- Shows: credential name, description snippet

### Middle Panel: Schema Editor (Tree View)

**Schema Metadata Section** (collapsible)
- `$id` - Auto-generated based on filename: `https://openpropertyassociation.ca/credentials/schemas/{filename}.json`
- `$schema` - Fixed: `https://json-schema.org/draft/2020-12/schema`
- `title` - User input
- `description` - User input
- `x-governance-doc` - Auto-populated from left panel selection (URL to governance doc)

**Properties Tree** (main editing area)
- Hierarchical tree view (expand/collapse like VS Code file explorer)
- Root level shows `credentialSubject` object (required, auto-created)
- User adds properties inside `credentialSubject`
- Each property node shows: name, type, required indicator

**Property Editor** (when property selected)
- Property name (JSON key)
- Title (human-readable)
- Description
- Type dropdown: `string`, `integer`, `number`, `boolean`, `object`, `array`
- Required toggle
- **Type-specific constraints:**
  - String: `minLength`, `maxLength`, `format` (email, uri, date, date-time, uuid), `pattern` (regex), `enum` (list of allowed values)
  - Integer/Number: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`
  - Array: `minItems`, `maxItems`, `uniqueItems`, item type
  - Object: nested properties (recursive)

### Right Panel: JSON Preview

- Live-updating JSON Schema output
- Syntax highlighted (like VCT Builder)
- Copy to clipboard button
- Download as .json button

---

## JSON Schema Output Format

Based on W3C VC JSON Schema spec and SD-JWT VC requirements:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpropertyassociation.ca/credentials/schemas/home-credential.json",
  "title": "Home Credential",
  "description": "A verifiable credential for property ownership verification.",
  "x-governance-doc": "https://openpropertyassociation.ca/governance/home-credential/",
  "type": "object",
  "required": ["credentialSubject", "iss", "iat", "vct"],
  "properties": {
    "iss": {
      "title": "Issuer",
      "description": "URI identifying the issuer of the credential.",
      "type": "string",
      "format": "uri"
    },
    "iat": {
      "title": "Issued At",
      "description": "Unix timestamp when the credential was issued.",
      "type": "integer"
    },
    "exp": {
      "title": "Expiration",
      "description": "Unix timestamp when the credential expires.",
      "type": "integer"
    },
    "vct": {
      "title": "Verifiable Credential Type",
      "description": "URI identifying the credential type.",
      "type": "string",
      "format": "uri"
    },
    "cnf": {
      "title": "Confirmation",
      "description": "Holder binding confirmation claim.",
      "type": "object",
      "properties": {
        "jwk": {
          "type": "object",
          "description": "JSON Web Key for holder binding"
        }
      }
    },
    "credentialSubject": {
      "title": "Credential Subject",
      "description": "Claims about the subject of the credential.",
      "type": "object",
      "required": [],
      "properties": {
        // User-defined properties go here
      }
    }
  }
}
```

### Standard VC Properties (Auto-included)

These are automatically added to every schema with standard definitions:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `iss` | string (uri) | Yes | Issuer URI |
| `iat` | integer | Yes | Issued at timestamp |
| `exp` | integer | No | Expiration timestamp |
| `vct` | string (uri) | Yes | Credential type URI |
| `cnf` | object | No | Holder confirmation/binding |
| `credentialSubject` | object | Yes | Container for credential claims |

---

## Data Storage

### Local Schema Projects

Same pattern as VCT Builder:
- Stored per-user on server (Render disk)
- API endpoints: `/api/schema-projects` (CRUD)
- Structure:

```typescript
interface SchemaProject {
  id: string;
  name: string;
  schema: JSONSchema;          // The full schema object
  governanceDocId?: string;    // Selected governance doc filename
  createdAt: string;
  updatedAt: string;
}
```

### GitHub Integration

**Schema Library** (read from repo):
- Endpoint: `GET /api/github/schema-library`
- Path: `credentials/schemas/` in governance repo
- Lists existing `.json` schema files

**Create PR** (submit new schema):
- Endpoint: `POST /api/github/schema`
- Creates branch: `schema/add-{filename}-{timestamp}`
- Adds file to `credentials/schemas/{filename}.json`
- Creates PR to main branch

---

## TypeScript Interfaces

```typescript
// Schema property definition
interface SchemaProperty {
  id: string;                    // Unique ID for UI
  name: string;                  // JSON property name
  title: string;
  description?: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;

  // String constraints
  minLength?: number;
  maxLength?: number;
  format?: 'email' | 'uri' | 'date' | 'date-time' | 'uuid';
  pattern?: string;
  enum?: string[];

  // Number constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;

  // Array constraints
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: SchemaProperty;        // For array item type

  // Object nested properties
  properties?: SchemaProperty[];
}

// Schema metadata
interface SchemaMetadata {
  id: string;                    // $id URL
  title: string;
  description: string;
  governanceDocUrl?: string;     // x-governance-doc
}

// Full schema project
interface SchemaProject {
  id: string;
  name: string;
  metadata: SchemaMetadata;
  properties: SchemaProperty[];  // credentialSubject properties
  createdAt: string;
  updatedAt: string;
}

// Store state
interface SchemaStore {
  currentSchema: SchemaProject | null;
  savedSchemas: SchemaProject[];
  selectedProperty: string | null;  // ID of selected property in tree
  isDirty: boolean;

  // Actions
  newSchema: () => void;
  saveSchema: (name: string) => Promise<void>;
  loadSchema: (id: string) => void;
  deleteSchema: (id: string) => Promise<void>;

  // Metadata actions
  updateMetadata: (metadata: Partial<SchemaMetadata>) => void;

  // Property actions
  addProperty: (parentId?: string) => void;
  updateProperty: (id: string, updates: Partial<SchemaProperty>) => void;
  deleteProperty: (id: string) => void;
  reorderProperties: (propertyIds: string[]) => void;

  // Selection
  selectProperty: (id: string | null) => void;

  // Export
  exportSchema: () => string;   // Returns JSON string
  importSchema: (json: string) => void;
}
```

---

## Files to Create

### Frontend

| File | Description |
|------|-------------|
| `src/apps/SchemaBuilder/SchemaBuilderApp.tsx` | Main app component (3-panel layout) |
| `src/apps/SchemaBuilder/index.ts` | Export |
| `src/store/schemaStore.ts` | Zustand store for schema state |
| `src/types/schema.ts` | TypeScript interfaces |
| `src/components/SchemaBuilder/GovernanceDocsList.tsx` | Left panel - governance docs list |
| `src/components/SchemaBuilder/SchemaEditor.tsx` | Middle panel - main editor |
| `src/components/SchemaBuilder/MetadataForm.tsx` | Schema metadata form |
| `src/components/SchemaBuilder/PropertyTree.tsx` | Tree view of properties |
| `src/components/SchemaBuilder/PropertyEditor.tsx` | Property detail editor |
| `src/components/SchemaBuilder/JsonPreview.tsx` | Right panel - JSON output |
| `src/components/SchemaBuilder/SchemaToolbar.tsx` | Toolbar actions |
| `src/components/SchemaBuilder/SchemaLibrary.tsx` | Modal for browsing saved/repo schemas |
| `src/components/SchemaBuilder/SaveToRepoModal.tsx` | Modal for creating PR |

### Backend

| File | Changes |
|------|---------|
| `server/proxy.js` | Add `/api/schema-projects` CRUD endpoints |
| `server/github.js` | Add schema library + PR endpoints (may already exist) |

### Routing

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/apps/schema-builder/*` |
| `src/pages/AppSelectionPage.tsx` | Update Schema Builder card (remove "Coming Soon") |

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Create schema types and interfaces
- [ ] Create schemaStore with Zustand
- [ ] Add schema project API endpoints to server
- [ ] Set up routing and app shell

### Phase 2: UI Components
- [ ] SchemaBuilderApp (3-panel layout)
- [ ] GovernanceDocsList (left panel)
- [ ] MetadataForm (schema metadata)
- [ ] PropertyTree (tree view)
- [ ] PropertyEditor (property details)
- [ ] JsonPreview (right panel)

### Phase 3: Property Editing
- [ ] Add/delete properties
- [ ] Edit all property fields
- [ ] Handle nested objects
- [ ] Handle arrays
- [ ] Constraint validation

### Phase 4: GitHub Integration
- [ ] Schema Library (browse existing)
- [ ] Create PR workflow
- [ ] SaveToRepoModal

### Phase 5: Polish
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop reordering
- [ ] Schema validation
- [ ] Import existing schema

---

## References

- [W3C VC JSON Schema Specification](https://www.w3.org/TR/vc-json-schema/)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [SD-JWT VC Specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)
- [IATA Employee Schema Example](https://iata.trustregistry.nborbit.ca/.well-known/schema/employee.json)

---

## Open Questions

1. Should we support `$ref` for reusable definitions (e.g., address object)?
2. Should there be a "preview" mode showing sample credential data?
3. Should we validate against the linked governance doc attributes?
4. Should we support schema versioning (e.g., `home-credential-v1.json`)?
