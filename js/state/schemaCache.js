/**
 * Schema Cache Module
 * 
 * Caches model schemas for autocomplete and property lookups.
 * This is for UI convenience - developers can see the API calls in console.
 */

import { tandemBaseURL, makeRequestOptionsGET } from '../api.js';

// Schema cache: modelURN -> { attributes: [...], lookup: Map(qualifiedProp -> attribute) }
const schemaCache = {};

/**
 * Fetch schema for a model (logs to console for educational purposes)
 * @param {string} modelURN - Model URN
 * @param {string} region - Region header
 * @returns {Promise<Object>} Schema object
 */
async function fetchSchema(modelURN, region) {
  const requestPath = `${tandemBaseURL}/modeldata/${modelURN}/schema`;
  console.log(`SCHEMA CACHE: GET ${requestPath}`);
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schema:', error);
    return { attributes: [] };
  }
}

/**
 * Load and cache schema for a model
 * @param {string} modelURN - Model URN
 * @param {string} region - Region header
 * @returns {Promise<Object>} Schema object with attributes array and lookup map
 */
export async function loadSchemaForModel(modelURN, region) {
  if (schemaCache[modelURN]) {
    return schemaCache[modelURN];
  }
  
  const schema = await fetchSchema(modelURN, region);
  
  // Create a lookup map for quick property lookups
  const lookup = new Map();
  if (schema.attributes) {
    schema.attributes.forEach(attr => {
      lookup.set(attr.id, attr);
    });
  }
  
  schemaCache[modelURN] = {
    attributes: schema.attributes || [],
    lookup: lookup
  };
  
  console.log(`SCHEMA CACHE: Model ${modelURN} → ${schema.attributes?.length || 0} attributes cached`);
  
  return schemaCache[modelURN];
}

/**
 * Load schemas for all models in a facility
 * @param {Array} models - Array of model objects from facility info
 * @param {string} region - Region header
 * @returns {Promise<void>}
 */
export async function loadSchemasForFacility(models, region) {
  console.group("SCHEMA CACHE: Loading schemas for all models...");
  
  const promises = models.map(model => loadSchemaForModel(model.modelId, region));
  await Promise.all(promises);
  
  const totalAttributes = Object.values(schemaCache).reduce((sum, schema) => sum + schema.attributes.length, 0);
  console.log(`✓ Schema cache ready (${totalAttributes} total attributes across ${models.length} models)`);
  console.groupEnd();
}

/**
 * Get unique category names from all cached schemas
 * @returns {Array<string>} Sorted array of unique category names
 */
export function getUniqueCategoryNames() {
  const categories = new Set();
  
  for (const schema of Object.values(schemaCache)) {
    for (const attr of schema.attributes) {
      if (attr.category) {
        categories.add(attr.category);
      }
    }
  }
  
  return Array.from(categories).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Get unique property names from all cached schemas, optionally filtered by category
 * @param {string} [categoryFilter] - Optional category name to filter by
 * @returns {Array<string>} Sorted array of unique property names
 */
export function getUniquePropertyNames(categoryFilter = null) {
  const properties = new Set();
  
  for (const schema of Object.values(schemaCache)) {
    for (const attr of schema.attributes) {
      if (categoryFilter) {
        // Filter by category if specified
        if (attr.category === categoryFilter && attr.name) {
          properties.add(attr.name);
        }
      } else {
        // All properties
        if (attr.name) {
          properties.add(attr.name);
        }
      }
    }
  }
  
  return Array.from(properties).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Get the schema cache object
 * @returns {Object} Schema cache
 */
export function getSchemaCache() {
  return schemaCache;
}

/**
 * Clear the schema cache
 * Should be called when switching facilities
 */
export function clearSchemaCache() {
  for (const key in schemaCache) {
    delete schemaCache[key];
  }
  console.log('SCHEMA CACHE: Cleared');
}

/**
 * Check if schemas are loaded
 * @returns {boolean} True if any schemas are cached
 */
export function areSchemasLoaded() {
  return Object.keys(schemaCache).length > 0;
}

/**
 * Look up a property's attribute info by category and name
 * @param {string} category - Category name (e.g., "Identity Data")
 * @param {string} propertyName - Property name (e.g., "Mark")
 * @returns {Object|null} Property attribute object with dataType, or null if not found
 */
export function getPropertyInfo(category, propertyName) {
  for (const schema of Object.values(schemaCache)) {
    for (const attr of schema.attributes) {
      if (attr.category === category && attr.name === propertyName) {
        return attr;
      }
    }
  }
  return null;
}

/**
 * Data type constants for Tandem properties
 * These match the dataType field in schema attributes
 */
export const DataTypes = {
  INTEGER: 1,
  FLOAT: 2,
  BOOLEAN: 3,
  STRING: 20,
  
  // Helper to check if a dataType is numeric
  isNumeric: (dataType) => dataType === 1 || dataType === 2,
  
  // Helper to check if a dataType is boolean
  isBoolean: (dataType) => dataType === 3,
  
  // Helper to get a friendly name for a dataType
  getName: (dataType) => {
    switch (dataType) {
      case 1: return 'Integer';
      case 2: return 'Float';
      case 3: return 'Boolean';
      case 20: return 'String';
      default: return 'Unknown';
    }
  }
};

