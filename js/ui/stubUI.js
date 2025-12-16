/**
 * STUB UI Rendering
 * 
 * This module handles the UI for STUB functions - buttons, input forms, etc.
 * It's separated from the STUB logic to maintain clean separation of concerns.
 * 
 * PATTERN:
 * - Each STUB function gets a button or expandable section
 * - Click handlers are attached to execute the STUB functions
 * - Results go to console (not displayed in UI) for educational purposes
 */

import * as facilityStubs from '../stubs/facilityStubs.js';
import * as modelStubs from '../stubs/modelStubs.js';
import * as propertyStubs from '../stubs/propertyStubs.js';
import * as groupStubs from '../stubs/groupStubs.js';
import * as streamStubs from '../stubs/streamStubs.js';
import { getDefaultModelURN, getModels } from '../api.js';
import { getCachedGroups } from '../app.js';
import { getUniqueCategoryNames, getUniquePropertyNames, areSchemasLoaded, getPropertyInfo, getPropertyInfoByQualifiedId, DataTypes } from '../state/schemaCache.js';

// Store current facility context for STUB functions
let currentFacilityURN = null;
let currentFacilityRegion = null;
let currentModels = [];
let explicitGroupsCache = null; // Set when user explicitly calls GET Groups (All)

/**
 * Get groups for dropdown - uses explicit cache if available, otherwise app's cached groups
 */
function getGroupsForDropdown() {
  if (explicitGroupsCache !== null) {
    return explicitGroupsCache;
  }
  return getCachedGroups();
}

// Helper functions to remember last used input values
function saveInputValue(key, value) {
  sessionStorage.setItem(`stub_input_${key}`, value);
}

function getLastInputValue(key, defaultValue) {
  const saved = sessionStorage.getItem(`stub_input_${key}`);
  return saved !== null ? saved : defaultValue;
}

// Generate unique ID for datalist elements
let datalistIdCounter = 0;
function generateDatalistId() {
  return `datalist-${Date.now()}-${datalistIdCounter++}`;
}

/**
 * Create an autocomplete select dropdown for category or property names
 * 
 * @param {Object} field - Field configuration with id, placeholder, defaultValue, autocomplete type
 * @param {HTMLElement} inputForm - The parent form element (used to find related inputs)
 * @returns {HTMLSelectElement} The configured select element
 */
function createAutocompleteSelect(field, inputForm) {
  const select = document.createElement('select');
  select.id = field.id;
  select.className = 'w-full text-xs';
  
  let options = [];
  if (field.autocomplete === 'category') {
    options = getUniqueCategoryNames();
  } else if (field.autocomplete === 'property') {
    // Get properties, optionally filtered by category
    const categoryInput = inputForm.querySelector('#propCategory') || inputForm.querySelector('#categoryName');
    const categoryFilter = categoryInput ? categoryInput.value : null;
    options = getUniquePropertyNames(categoryFilter);
  }
  
  // Add all options (no placeholder needed - we auto-select first/last-used)
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
  
  // Set default value: prefer last-used, otherwise first option
  const defaultValue = typeof field.defaultValue === 'function' 
    ? field.defaultValue() 
    : (field.defaultValue || '');
  if (defaultValue && options.includes(defaultValue)) {
    select.value = defaultValue;
  } else if (options.length > 0) {
    select.value = options[0];
  }
  
  // For property dropdown, update when category changes
  if (field.autocomplete === 'property') {
    const categoryInput = inputForm.querySelector('#propCategory') || inputForm.querySelector('#categoryName');
    if (categoryInput) {
      categoryInput.addEventListener('change', () => {
        const newOptions = getUniquePropertyNames(categoryInput.value || null);
        select.innerHTML = '';
        
        // Add all options (no placeholder - we auto-select)
        newOptions.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        
        // Try to select: 1) last used value if it exists in new list, or 2) first option
        const lastUsed = getLastInputValue('propName', '');
        if (lastUsed && newOptions.includes(lastUsed)) {
          select.value = lastUsed;
        } else if (newOptions.length > 0) {
          select.value = newOptions[0];
        }
        
        // Trigger change event so type-aware input updates
        select.dispatchEvent(new Event('change'));
      });
    }
  }
  
  // If options exist but no valid default was set, select the first option
  if (field.autocomplete === 'property' && options.length > 0 && !select.value) {
    const lastUsed = getLastInputValue('propName', '');
    if (lastUsed && options.includes(lastUsed)) {
      select.value = lastUsed;
    } else {
      select.value = options[0];
    }
  }
  
  return select;
}

/**
 * Shared helper to render a type-aware input element based on property info
 * 
 * @param {Object} propInfo - Property info object from schema
 * @param {HTMLElement} inputWrapper - Container for the input
 * @param {HTMLElement} typeIndicator - Element to show type info
 * @returns {HTMLElement} The created input element
 */
function renderTypeAwareInput(propInfo, inputWrapper, typeIndicator) {
  inputWrapper.innerHTML = '';
  let inputElement;
  
  if (propInfo && DataTypes.isBoolean(propInfo)) {
    // Boolean - create dropdown
    inputElement = document.createElement('select');
    inputElement.id = 'propVal';
    inputElement.className = 'w-full text-xs';
    
    const optTrue = document.createElement('option');
    optTrue.value = 'true';
    optTrue.textContent = 'True';
    
    const optFalse = document.createElement('option');
    optFalse.value = 'false';
    optFalse.textContent = 'False';
    
    inputElement.appendChild(optTrue);
    inputElement.appendChild(optFalse);
    
    typeIndicator.textContent = '📋 Boolean property - select True or False';
    typeIndicator.style.color = '#10b981';
    
  } else if (propInfo && DataTypes.isNumeric(propInfo)) {
    // Numeric - create number input
    inputElement = document.createElement('input');
    inputElement.type = 'number';
    inputElement.id = 'propVal';
    inputElement.placeholder = 'Enter a number...';
    inputElement.className = 'w-full text-xs';
    inputElement.step = propInfo.dataType === 2 ? '1' : 'any'; // dataType 2 = Integer
    
    typeIndicator.textContent = `🔢 ${DataTypes.getName(propInfo)} property - enter a number`;
    typeIndicator.style.color = '#3b82f6';
    
  } else {
    // String or unknown - text input
    inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.id = 'propVal';
    inputElement.placeholder = 'Enter text value...';
    inputElement.className = 'w-full text-xs';
    
    if (propInfo) {
      typeIndicator.textContent = `📝 ${DataTypes.getName(propInfo)} property`;
      typeIndicator.style.color = '#8b5cf6';
    } else {
      typeIndicator.textContent = '⚠️ Property not found in schema - using text input';
      typeIndicator.style.color = '#f59e0b';
    }
  }
  
  inputWrapper.appendChild(inputElement);
  return inputElement;
}

/**
 * Create a type-aware value input that adapts based on the selected property's dataType
 * 
 * @param {HTMLElement} inputForm - The parent form element
 * @param {string} categoryInputId - ID of the category input element
 * @param {string} propertyInputId - ID of the property input element
 * @returns {Object} Object with { container, getValue, validate }
 */
function createTypeAwareValueInput(inputForm, categoryInputId, propertyInputId) {
  const container = document.createElement('div');
  container.id = 'propValContainer';
  container.style.marginTop = '0.5rem';
  
  const label = document.createElement('label');
  label.textContent = 'Property Value';
  label.style.display = 'block';
  label.style.marginBottom = '0.25rem';
  
  const inputWrapper = document.createElement('div');
  inputWrapper.id = 'propValInputWrapper';
  
  // Start with a text input
  let currentInput = document.createElement('input');
  currentInput.type = 'text';
  currentInput.id = 'propVal';
  currentInput.placeholder = 'Select a property first...';
  currentInput.className = 'w-full text-xs';
  inputWrapper.appendChild(currentInput);
  
  // Type indicator
  const typeIndicator = document.createElement('div');
  typeIndicator.id = 'propValTypeIndicator';
  typeIndicator.style.fontSize = '0.65rem';
  typeIndicator.style.color = '#6b7280';
  typeIndicator.style.marginTop = '0.25rem';
  typeIndicator.textContent = '';
  
  container.appendChild(label);
  container.appendChild(inputWrapper);
  container.appendChild(typeIndicator);
  
  // Function to update the input based on property type
  const updateInputForProperty = () => {
    const categoryInput = inputForm.querySelector(`#${categoryInputId}`);
    const propertyInput = inputForm.querySelector(`#${propertyInputId}`);
    
    if (!categoryInput || !propertyInput) return;
    
    const category = categoryInput.value;
    const propName = propertyInput.value;
    
    if (!category || !propName) {
      typeIndicator.textContent = '';
      return;
    }
    
    const propInfo = getPropertyInfo(category, propName);
    currentInput = renderTypeAwareInput(propInfo, inputWrapper, typeIndicator);
  };
  
  // Set up event listeners using event delegation on the form
  // This ensures we catch events even if the select elements are rebuilt
  inputForm.addEventListener('change', (event) => {
    const targetId = event.target.id;
    if (targetId === categoryInputId || targetId === propertyInputId) {
      updateInputForProperty();
    }
  });
  
  // Initial update after a brief delay to ensure all elements are ready
  setTimeout(() => {
    updateInputForProperty();
  }, 50);
  
  return {
    container,
    getValue: () => {
      const input = inputWrapper.querySelector('#propVal');
      return input ? input.value : '';
    },
    validate: () => {
      const categoryInput = inputForm.querySelector(`#${categoryInputId}`);
      const propertyInput = inputForm.querySelector(`#${propertyInputId}`);
      const input = inputWrapper.querySelector('#propVal');
      
      if (!categoryInput?.value || !propertyInput?.value) {
        return { valid: false, error: 'Please select a category and property first.' };
      }
      
      const propInfo = getPropertyInfo(categoryInput.value, propertyInput.value);
      const value = input?.value;
      
      if (!value && value !== '0' && value !== 'false') {
        return { valid: false, error: 'Please enter a value.' };
      }
      
      // Use full propInfo object for type checking (handles unit-based types)
      if (propInfo && DataTypes.isNumeric(propInfo)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return { valid: false, error: `Please enter a valid number for this ${DataTypes.getName(propInfo)} property.` };
        }
        if (propInfo.dataType === 2 && !Number.isInteger(numValue)) {
          return { valid: false, error: 'Please enter a whole number (integer) for this property.' };
        }
      }
      
      return { valid: true };
    }
  };
}

/**
 * Create a type-aware value input that adapts based on a qualified property ID
 * Watches a text input for the qualified prop and updates the value input type accordingly.
 * 
 * @param {HTMLElement} inputForm - The parent form element
 * @param {string} qualPropInputId - ID of the qualified property text input element
 * @returns {Object} Object with { container, getValue, validate }
 */
function createTypeAwareValueInputByQualifiedProp(inputForm, qualPropInputId) {
  const container = document.createElement('div');
  container.id = 'propValContainer';
  container.style.marginTop = '0.5rem';
  
  const label = document.createElement('label');
  label.textContent = 'Property Value';
  label.style.display = 'block';
  label.style.marginBottom = '0.25rem';
  
  const inputWrapper = document.createElement('div');
  inputWrapper.id = 'propValInputWrapper';
  
  // Start with a text input
  let currentInput = document.createElement('input');
  currentInput.type = 'text';
  currentInput.id = 'propVal';
  currentInput.placeholder = 'Enter qualified prop ID first...';
  currentInput.className = 'w-full text-xs';
  inputWrapper.appendChild(currentInput);
  
  // Type indicator
  const typeIndicator = document.createElement('div');
  typeIndicator.id = 'propValTypeIndicator';
  typeIndicator.style.fontSize = '0.65rem';
  typeIndicator.style.color = '#6b7280';
  typeIndicator.style.marginTop = '0.25rem';
  typeIndicator.textContent = '';
  
  container.appendChild(label);
  container.appendChild(inputWrapper);
  container.appendChild(typeIndicator);
  
  // Function to update the input based on property type
  const updateInputForQualifiedProp = () => {
    const qualPropInput = inputForm.querySelector(`#${qualPropInputId}`);
    
    if (!qualPropInput) return;
    
    const qualPropId = qualPropInput.value.trim();
    
    if (!qualPropId) {
      typeIndicator.textContent = '';
      return;
    }
    
    const propInfo = getPropertyInfoByQualifiedId(qualPropId);
    currentInput = renderTypeAwareInput(propInfo, inputWrapper, typeIndicator);
  };
  
  // Watch for changes on the qualified prop input (blur and input events)
  inputForm.addEventListener('blur', (event) => {
    if (event.target.id === qualPropInputId) {
      updateInputForQualifiedProp();
    }
  }, true); // Use capture to catch blur
  
  inputForm.addEventListener('input', (event) => {
    if (event.target.id === qualPropInputId) {
      // Debounce - only update after user stops typing
      clearTimeout(inputForm._qualPropDebounce);
      inputForm._qualPropDebounce = setTimeout(updateInputForQualifiedProp, 300);
    }
  });
  
  // Initial update after a brief delay
  setTimeout(() => {
    updateInputForQualifiedProp();
  }, 50);
  
  return {
    container,
    getValue: () => {
      const input = inputWrapper.querySelector('#propVal');
      return input ? input.value : '';
    },
    validate: () => {
      const qualPropInput = inputForm.querySelector(`#${qualPropInputId}`);
      const input = inputWrapper.querySelector('#propVal');
      
      if (!qualPropInput?.value) {
        return { valid: false, error: 'Please enter a qualified property ID first.' };
      }
      
      const propInfo = getPropertyInfoByQualifiedId(qualPropInput.value.trim());
      const value = input?.value;
      
      if (!value && value !== '0' && value !== 'false') {
        return { valid: false, error: 'Please enter a value.' };
      }
      
      // Type validation
      if (propInfo && DataTypes.isNumeric(propInfo)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return { valid: false, error: `Please enter a valid number for this ${DataTypes.getName(propInfo)} property.` };
        }
        if (propInfo.dataType === 2 && !Number.isInteger(numValue)) {
          return { valid: false, error: 'Please enter a whole number (integer) for this property.' };
        }
      }
      
      return { valid: true };
    }
  };
}

/**
 * Main function to render all STUB sections
 * 
 * This is called when a facility is selected. It renders all available
 * STUB functions organized by category in dropdown menus.
 * 
 * @param {HTMLElement} container - DOM container for stubs
 * @param {string} facilityURN - Current facility URN
 * @param {string} region - Current region
 */
export async function renderStubs(container, facilityURN, region) {
  // Store context
  currentFacilityURN = facilityURN;
  currentFacilityRegion = region;
  
  // Load models for this facility (needed for model selector)
  currentModels = await getModels(facilityURN, region) || [];
  
  container.innerHTML = '';
  
  // Create Facility Stubs Dropdown
  const facilityDropdown = createDropdownMenu('Facility Stubs', [
    {
      label: 'GET Facility Info',
      action: () => facilityStubs.getFacilityInfo(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Facility Template',
      action: () => facilityStubs.getFacilityTemplate(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Facility Inline Template',
      action: () => facilityStubs.getInlineTemplate(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Facility Subjects',
      action: () => facilityStubs.getSubjects(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET User Access Levels (all)',
      action: () => facilityStubs.getFacilityUsers(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET User Access Level (by ID)',
      hasInput: true,
      inputConfig: {
        type: 'text',
        label: 'User ID',
        placeholder: 'Enter User ID (e.g., from GET Facility Subjects)',
        defaultValue: '',
        onExecute: (userID) => facilityStubs.getFacilityUserAccessLevel(currentFacilityURN, currentFacilityRegion, userID)
      }
    },
    {
      label: 'GET Facility Thumbnail',
      action: () => facilityStubs.getThumbnail(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Saved Views',
      action: () => facilityStubs.getSavedViews(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Saved View (by UUID)',
      hasInput: true,
      inputConfig: {
        type: 'text',
        label: 'View UUID',
        placeholder: 'Enter View UUID (from GET Saved Views)',
        defaultValue: '',
        onExecute: (viewUUID) => facilityStubs.getSavedViewByUUID(currentFacilityURN, currentFacilityRegion, viewUUID)
      }
    },
    {
      label: 'GET Saved View Thumbnail',
      hasInput: true,
      inputConfig: {
        type: 'text',
        label: 'View UUID',
        placeholder: 'Enter View UUID (from GET Saved Views)',
        defaultValue: '',
        onExecute: (viewUUID) => facilityStubs.getSavedViewThumbnail(currentFacilityURN, currentFacilityRegion, viewUUID)
      }
    }
  ]);
  
  container.appendChild(facilityDropdown);
  
  // Create Model Stubs Dropdown
  const modelDropdown = createDropdownMenu('Model Stubs', [
    {
      label: 'GET Model Properties',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => modelStubs.getModelProperties(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET Model',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => modelStubs.getModel(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET AEC Model Data',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => modelStubs.getAECModelData(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET Model Data Attributes',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => modelStubs.getModelDataAttrs(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET Model Data Schema',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => modelStubs.getModelDataSchema(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET Model Data Fragments',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Element Keys (comma-separated, optional)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Leave empty for entire model',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => modelStubs.getModelDataFragments(modelUrn, currentFacilityRegion, additionalValues.elemKeys || '')
      }
    }
  ]);
  
  container.appendChild(modelDropdown);
  
  // Create Property Stubs Dropdown
  const propertyDropdown = createDropdownMenu('Property Stubs', [
    {
      label: 'GET Qualified Property',
      hasInput: true,
      inputConfig: {
        type: 'multiText',
        fields: [
          {
            label: 'Category Name',
            id: 'categoryName',
            type: 'text',
            placeholder: 'e.g., Identity Data, Dimensions',
            defaultValue: () => getLastInputValue('categoryName', 'Identity Data'),
            autocomplete: 'category'
          },
          {
            label: 'Property Name',
            id: 'propName',
            type: 'text',
            placeholder: 'e.g., Mark, Comments',
            defaultValue: () => getLastInputValue('propName', 'Mark'),
            autocomplete: 'property'
          }
        ],
        onExecute: (values) => {
          saveInputValue('categoryName', values.categoryName);
          saveInputValue('propName', values.propName);
          return propertyStubs.getQualifiedProperty(currentFacilityURN, currentFacilityRegion, values.categoryName, values.propName);
        }
      }
    },
    {
      label: 'SCAN for Property',
      hasInput: true,
      inputConfig: {
        type: 'multiText',
        fields: [
          {
            label: 'Category Name',
            id: 'categoryName',
            type: 'text',
            placeholder: 'e.g., Identity Data, Dimensions',
            defaultValue: () => getLastInputValue('categoryName', 'Identity Data'),
            autocomplete: 'category'
          },
          {
            label: 'Property Name',
            id: 'propName',
            type: 'text',
            placeholder: 'e.g., Mark, Comments',
            defaultValue: () => getLastInputValue('propName', 'Mark'),
            autocomplete: 'property'
          },
          {
            label: 'Include History',
            id: 'includeHistory',
            type: 'checkbox',
            defaultValue: false
          }
        ],
        onExecute: (values) => {
          saveInputValue('categoryName', values.categoryName);
          saveInputValue('propName', values.propName);
          return propertyStubs.scanForProperty(currentFacilityURN, currentFacilityRegion, values.categoryName, values.propName, values.includeHistory);
        }
      }
    },
    {
      label: 'SCAN for User Props',
      action: () => propertyStubs.scanForUserProps(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'Find Elements where Property = X',
      hasInput: true,
      inputConfig: {
        type: 'multiText',
        fields: [
          {
            label: 'Category Name',
            id: 'categoryName',
            type: 'text',
            placeholder: 'e.g., Identity Data, Dimensions',
            defaultValue: () => getLastInputValue('categoryName', 'Identity Data'),
            autocomplete: 'category'
          },
          {
            label: 'Property Name',
            id: 'propName',
            type: 'text',
            placeholder: 'e.g., Mark, Comments',
            defaultValue: () => getLastInputValue('propName', 'Mark'),
            autocomplete: 'property'
          },
          {
            label: 'Match String',
            id: 'matchStr',
            type: 'text',
            placeholder: 'e.g., Basic Wall or ^Concrete',
            defaultValue: () => getLastInputValue('matchStr', '')
          },
          {
            label: 'Is Javascript RegEx?',
            id: 'isRegEx',
            type: 'checkbox',
            defaultValue: true
          },
          {
            label: 'Is Case Insensitive?',
            id: 'isCaseInsensitive',
            type: 'checkbox',
            defaultValue: false
          }
        ],
        showRegexHelp: true, // Flag to show regex help
        onExecute: (values) => {
          saveInputValue('categoryName', values.categoryName);
          saveInputValue('propName', values.propName);
          saveInputValue('matchStr', values.matchStr);
          return propertyStubs.findElementsWherePropValueEquals(
            currentFacilityURN, 
            currentFacilityRegion, 
            values.categoryName, 
            values.propName, 
            values.matchStr,
            values.isRegEx,
            values.isCaseInsensitive
          );
        }
      }
    },
    {
      label: 'SCAN Brute Force (full model)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => propertyStubs.getScanBruteForce(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'SCAN with Options',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Element Keys (comma-separated, optional)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Leave empty for entire model',
            defaultValue: ''
          },
          {
            label: 'Column Families',
            id: 'colFamilies',
            type: 'checklist',
            options: [
              { value: 'n', label: 'n - Standard (name, flags, etc.)' },
              { value: 'z', label: 'z - DtProperties (user-defined)' },
              { value: 'l', label: 'l - Refs (same-model references)' },
              { value: 'x', label: 'x - XRefs (cross-model references)' },
              { value: 'm', label: 'm - Source (original model data)' },
              { value: 's', label: 's - Systems' }
            ],
            defaultValue: ['n']
          },
          {
            label: 'Include History',
            id: 'includeHistory',
            type: 'checkbox',
            defaultValue: false
          }
        ],
        onExecute: (modelUrn, additionalValues) => {
          const elemKeys = additionalValues.elemKeys || '';
          const colFamilies = additionalValues.colFamilies || '';
          const includeHistory = additionalValues.includeHistory || false;
          return propertyStubs.getScanElementsOptions(modelUrn, currentFacilityRegion, elemKeys, includeHistory, colFamilies);
        }
      }
    },
    {
      label: 'SCAN with Qualified Props',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Element Keys (comma-separated, optional)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Leave empty for entire model',
            defaultValue: ''
          },
          {
            label: 'Qualified Properties (comma-separated)',
            id: 'qualProps',
            type: 'text',
            placeholder: 'e.g., z:5mQ,n:n (from GET Schema)',
            defaultValue: 'n:n'
          },
          {
            label: 'Include History',
            id: 'includeHistory',
            type: 'checkbox',
            defaultValue: false
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          propertyStubs.getScanElementsQualProps(modelUrn, currentFacilityRegion, additionalValues.elemKeys || '', additionalValues.includeHistory || false, additionalValues.qualProps || '')
      }
    },
    {
      label: 'SCAN Full Change History',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Element Keys (comma-separated, required)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Element keys are required',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => propertyStubs.getScanElementsFullChangeHistory(modelUrn, currentFacilityRegion, additionalValues.elemKeys || '')
      }
    },
    {
      label: 'Assign Classification',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Classification String',
            id: 'classificationStr',
            type: 'text',
            placeholder: 'e.g., Walls > Curtain Wall',
            defaultValue: ''
          },
          {
            label: 'Element Keys (comma-separated)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Keys of elements to update',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          propertyStubs.assignClassification(currentFacilityURN, currentFacilityRegion, additionalValues.classificationStr || '', modelUrn, additionalValues.elemKeys || '')
      }
    },
    {
      label: 'SET Property (by Category/Name)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Category Name',
            id: 'propCategory',
            type: 'text',
            placeholder: 'e.g., Identity Data',
            defaultValue: () => getLastInputValue('categoryName', 'Identity Data'),
            autocomplete: 'category'
          },
          {
            label: 'Property Name',
            id: 'propName',
            type: 'text',
            placeholder: 'e.g., Mark',
            defaultValue: () => getLastInputValue('propName', 'Mark'),
            autocomplete: 'property'
          },
          {
            id: 'propVal',
            type: 'typeAwareValue',
            categoryInputId: 'propCategory',
            propertyInputId: 'propName'
          },
          {
            label: 'Element Keys (comma-separated)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Keys of elements to update',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          propertyStubs.setPropertySelSet(modelUrn, currentFacilityRegion, additionalValues.propCategory || '', additionalValues.propName || '', additionalValues.propVal || '', additionalValues.elemKeys || '')
      }
    },
    {
      label: 'SET Property (by Qualified Prop)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Qualified Property ID',
            id: 'qualPropStr',
            type: 'text',
            placeholder: 'e.g., z:5mQ (from GET Schema)',
            defaultValue: ''
          },
          {
            id: 'propVal',
            type: 'typeAwareValueByQualifiedProp',
            qualPropInputId: 'qualPropStr'
          },
          {
            label: 'Element Keys (comma-separated)',
            id: 'elemKeys',
            type: 'text',
            placeholder: 'Keys of elements to update',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          propertyStubs.setPropertySelSetQP(modelUrn, currentFacilityRegion, additionalValues.qualPropStr || '', additionalValues.propVal || '', additionalValues.elemKeys || '')
      }
    }
  ]);
  
  container.appendChild(propertyDropdown);
  
  // Create Group Stubs Dropdown
  const groupDropdown = createDropdownMenu('Group Stubs', [
    {
      label: 'GET Groups (All)',
      hasInput: false,
      action: () => groupStubs.getGroups().then(groups => {
        // Store in explicit cache (overrides app's cached groups)
        explicitGroupsCache = groups || [];
      })
    },
    {
      label: 'GET Group (by URN)',
      hasInput: true,
      inputConfig: {
        type: 'groupSelect',
        label: 'Group',
        onExecute: (groupUrn) => groupStubs.getGroup(groupUrn)
      }
    },
    {
      label: 'GET Group Metrics',
      hasInput: true,
      inputConfig: {
        type: 'groupSelect',
        label: 'Group',
        onExecute: (groupUrn) => groupStubs.getGroupMetrics(groupUrn)
      }
    },
    {
      label: 'GET Facilities for Group',
      hasInput: true,
      inputConfig: {
        type: 'groupSelect',
        label: 'Group',
        onExecute: (groupUrn) => groupStubs.getFacilitiesForGroup(groupUrn)
      }
    }
  ]);
  
  container.appendChild(groupDropdown);
  
  // Create Stream Stubs Dropdown
  const streamDropdown = createDropdownMenu('Stream Stubs', [
    // === READ OPERATIONS ===
    {
      label: 'GET Streams (from model)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        onExecute: (modelUrn) => streamStubs.getStreamsFromModel(modelUrn, currentFacilityRegion)
      }
    },
    {
      label: 'GET Stream Secrets',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Keys (comma-separated)',
            id: 'streamKeys',
            type: 'text',
            placeholder: 'e.g., ABC123,DEF456',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.getStreamSecrets(modelUrn, currentFacilityRegion, additionalValues.streamKeys || '')
      }
    },
    {
      label: 'GET Stream Values (30 days)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Key',
            id: 'streamKey',
            type: 'text',
            placeholder: 'Single stream key',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.getStreamValues(modelUrn, currentFacilityRegion, additionalValues.streamKey || '', 30)
      }
    },
    {
      label: 'GET Stream Values (365 days)',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Key',
            id: 'streamKey',
            type: 'text',
            placeholder: 'Single stream key',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.getStreamValues(modelUrn, currentFacilityRegion, additionalValues.streamKey || '', 365)
      }
    },
    {
      label: 'GET Last Seen Stream Values',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Keys (comma-separated)',
            id: 'streamKeys',
            type: 'text',
            placeholder: 'e.g., ABC123,DEF456',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.getLastSeenStreamValues(modelUrn, currentFacilityRegion, additionalValues.streamKeys || '')
      }
    },
    // === WRITE OPERATIONS ===
    {
      label: 'POST Stream Values',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Key',
            id: 'streamKey',
            type: 'text',
            placeholder: 'Single stream key',
            defaultValue: ''
          },
          {
            label: 'Values (JSON)',
            id: 'valuesJson',
            type: 'text',
            placeholder: '{"test_val1": 22.5, "test_val2": 33.0}',
            defaultValue: '{"test_val1": 22.5, "test_val2": 33.0}'
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.postStreamValues(modelUrn, currentFacilityRegion, additionalValues.streamKey || '', additionalValues.valuesJson || '')
      }
    },
    {
      label: 'Reset Stream Secrets',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Keys (comma-separated)',
            id: 'streamKeys',
            type: 'text',
            placeholder: 'e.g., ABC123,DEF456',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.resetStreamSecrets(modelUrn, currentFacilityRegion, additionalValues.streamKeys || '')
      }
    },
    {
      label: 'Remove Host from Stream',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Keys (comma-separated)',
            id: 'streamKeys',
            type: 'text',
            placeholder: 'e.g., ABC123,DEF456',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.removeHostFromStream(modelUrn, currentFacilityRegion, additionalValues.streamKeys || '')
      }
    },
    {
      label: 'Delete Streams',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Model',
        additionalFields: [
          {
            label: 'Stream Keys (comma-separated)',
            id: 'streamKeys',
            type: 'text',
            placeholder: 'e.g., ABC123,DEF456',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.deleteStreams(modelUrn, currentFacilityRegion, additionalValues.streamKeys || '')
      }
    },
    // === CREATE/MODIFY OPERATIONS ===
    {
      label: 'Create Stream',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Default Model (streams are created here)',
        additionalFields: [
          {
            label: 'Stream Name',
            id: 'streamName',
            type: 'text',
            placeholder: 'e.g., Temperature Sensor 1',
            defaultValue: ''
          },
          {
            label: 'Host Model URN (optional)',
            id: 'hostModelURN',
            type: 'text',
            placeholder: 'Leave empty for no host',
            defaultValue: ''
          },
          {
            label: 'Host Element Key (optional)',
            id: 'hostKey',
            type: 'text',
            placeholder: 'Leave empty for no host',
            defaultValue: ''
          },
          {
            label: 'Classification (optional)',
            id: 'classification',
            type: 'text',
            placeholder: 'e.g., Walls > Curtain Wall',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.createStream(
            modelUrn, 
            currentFacilityRegion, 
            additionalValues.streamName || '',
            additionalValues.hostModelURN || '',
            additionalValues.hostKey || '',
            additionalValues.classification || ''
          )
      }
    },
    {
      label: 'Assign Host to Stream',
      hasInput: true,
      inputConfig: {
        type: 'modelSelect',
        label: 'Default Model',
        additionalFields: [
          {
            label: 'Stream Key',
            id: 'streamKey',
            type: 'text',
            placeholder: 'Key of stream to modify',
            defaultValue: ''
          },
          {
            label: 'Host Model URN',
            id: 'hostModelURN',
            type: 'text',
            placeholder: 'Model containing the host element',
            defaultValue: ''
          },
          {
            label: 'Host Element Key',
            id: 'hostKey',
            type: 'text',
            placeholder: 'Element key of the host',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, additionalValues) => 
          streamStubs.assignHostToStream(
            modelUrn,
            currentFacilityRegion,
            additionalValues.streamKey || '',
            additionalValues.hostModelURN || '',
            additionalValues.hostKey || ''
          )
      }
    }
  ]);
  
  container.appendChild(streamDropdown);
  
  // Add a help message at the bottom
  const helpDiv = document.createElement('div');
  helpDiv.className = 'mt-4 p-3 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-secondary';
  helpDiv.innerHTML = `
    <strong class="text-dark-text">Developer Tips:</strong><br>
    • Open Chrome DevTools (F12) to see output<br>
    • Click dropdown menus to see available endpoints<br>
    • All responses logged to console with details<br>
    • Check Network tab for HTTP requests
  `;
  container.appendChild(helpDiv);
}

/**
 * Create a dropdown menu with STUB functions
 * 
 * @param {string} title - Dropdown title
 * @param {Array} items - Array of {label, action, hasInput, inputConfig} objects
 * @returns {HTMLElement} Dropdown menu element
 */
function createDropdownMenu(title, items) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  
  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'dropdown-toggle';
  toggle.innerHTML = `
    <span>${title}</span>
    <svg class="dropdown-toggle-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;
  
  // Create dropdown content
  const content = document.createElement('div');
  content.className = 'dropdown-content';
  
  // Add items
  items.forEach((item, index) => {
    const itemContainer = document.createElement('div');
    
    const button = document.createElement('button');
    button.className = 'dropdown-item';
    button.textContent = item.label;
    
    // If item needs input, create expandable form
    if (item.hasInput && item.inputConfig) {
      const formId = `input-form-${Date.now()}-${index}`;
      const inputForm = document.createElement('div');
      inputForm.id = formId;
      inputForm.className = 'stub-input-form hidden';
      inputForm.style.margin = '0.375rem';
      inputForm.style.marginTop = '0';
      
      let mainInput;
      const additionalInputs = [];
      
      // Handle different input types
      if (item.inputConfig.type === 'multiText') {
        // Multiple fields (text inputs and/or checkboxes)
        item.inputConfig.fields.forEach((field, fieldIdx) => {
          const fieldType = field.type || 'text';
          
          if (fieldType === 'checkbox') {
            // Checkbox field - create a container with label and checkbox
            const checkboxContainer = document.createElement('div');
            checkboxContainer.style.marginTop = fieldIdx > 0 ? '0.5rem' : '0';
            checkboxContainer.style.display = 'flex';
            checkboxContainer.style.alignItems = 'center';
            checkboxContainer.style.gap = '0.5rem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = field.id;
            checkbox.checked = field.defaultValue || false;
            checkbox.style.width = 'auto';
            checkbox.style.cursor = 'pointer';
            
            const label = document.createElement('label');
            label.textContent = field.label;
            label.htmlFor = field.id;
            label.style.margin = '0';
            label.style.cursor = 'pointer';
            label.style.fontSize = '0.75rem';
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            inputForm.appendChild(checkboxContainer);
            
            additionalInputs.push(checkbox);
          } else {
            // Text input field (or select for autocomplete)
            const label = document.createElement('label');
            label.textContent = field.label;
            if (fieldIdx > 0) label.style.marginTop = '0.5rem';
            
            let input;
            
            // Use select dropdown for autocomplete if schemas are loaded
            if (field.autocomplete && areSchemasLoaded()) {
              input = createAutocompleteSelect(field, inputForm);
            } else {
              // Regular text input (fallback when schemas not loaded)
              input = document.createElement('input');
              input.type = 'text';
              input.id = field.id;
              input.placeholder = field.placeholder || '';
              input.value = typeof field.defaultValue === 'function' 
                ? field.defaultValue() 
                : (field.defaultValue || '');
              input.className = 'w-full text-xs';
            }
            
            inputForm.appendChild(label);
            inputForm.appendChild(input);
            
            if (fieldIdx === 0) {
              mainInput = input; // First field is "main"
            } else {
              additionalInputs.push(input);
            }
          }
        });
      } else {
        // Single field (model selector or text input)
        const mainLabel = document.createElement('label');
        mainLabel.textContent = item.inputConfig.label;
        
        if (item.inputConfig.type === 'modelSelect') {
          // Create a dropdown for model selection
          mainInput = document.createElement('select');
          mainInput.className = 'w-full text-xs';
          
          // Populate with models (in API order)
          const defaultModelURN = getDefaultModelURN(currentFacilityURN);
          currentModels.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model.modelId;
            
            const isDefault = model.modelId === defaultModelURN;
            const displayName = model.label || (isDefault ? '** Default Model **' : 'Untitled Model');
            
            // Show both name and URN for developer visibility
            option.textContent = `${displayName} - ${model.modelId}`;
            
            // Pre-select the first model in the list
            if (index === 0) {
              option.selected = true;
            }
            
            mainInput.appendChild(option);
          });
        } else if (item.inputConfig.type === 'groupSelect') {
          // Create a dropdown for group selection
          mainInput = document.createElement('select');
          mainInput.className = 'w-full text-xs';
          
          const groups = getGroupsForDropdown();
          if (groups.length === 0) {
            // No groups available
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- No groups available --';
            mainInput.appendChild(option);
          } else {
            // Populate with groups
            groups.forEach((group, index) => {
              const option = document.createElement('option');
              option.value = group.urn;
              
              // Show both name and URN for developer visibility
              const displayName = group.name || 'Unnamed Group';
              option.textContent = `${displayName} - ${group.urn}`;
              
              // Pre-select the first group in the list
              if (index === 0) {
                option.selected = true;
              }
              
              mainInput.appendChild(option);
            });
          }
        } else {
          // Regular text input
          mainInput = document.createElement('input');
          mainInput.type = 'text';
          mainInput.placeholder = item.inputConfig.placeholder;
          mainInput.value = typeof item.inputConfig.defaultValue === 'function' 
            ? item.inputConfig.defaultValue() 
            : item.inputConfig.defaultValue;
          mainInput.className = 'w-full text-xs';
        }
        
        inputForm.appendChild(mainLabel);
        inputForm.appendChild(mainInput);
        
        // Additional fields if specified
        if (item.inputConfig.additionalFields) {
          item.inputConfig.additionalFields.forEach(field => {
            const fieldType = field.type || 'text';
            
            if (fieldType === 'checkbox') {
              // Checkbox field
              const checkboxContainer = document.createElement('div');
              checkboxContainer.style.marginTop = '0.5rem';
              checkboxContainer.style.display = 'flex';
              checkboxContainer.style.alignItems = 'center';
              checkboxContainer.style.gap = '0.5rem';
              
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.id = field.id;
              checkbox.checked = field.defaultValue || false;
              checkbox.style.width = 'auto';
              checkbox.style.cursor = 'pointer';
              
              const label = document.createElement('label');
              label.textContent = field.label;
              label.htmlFor = field.id;
              label.style.margin = '0';
              label.style.cursor = 'pointer';
              label.style.fontSize = '0.75rem';
              
              checkboxContainer.appendChild(checkbox);
              checkboxContainer.appendChild(label);
              inputForm.appendChild(checkboxContainer);
              additionalInputs.push(checkbox);
              
            } else if (fieldType === 'checklist') {
              // Checklist field (multiple checkboxes)
              const label = document.createElement('label');
              label.textContent = field.label;
              label.style.marginTop = '0.5rem';
              inputForm.appendChild(label);
              
              const checklistContainer = document.createElement('div');
              checklistContainer.id = field.id;
              checklistContainer.style.display = 'grid';
              checklistContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
              checklistContainer.style.gap = '0.25rem';
              checklistContainer.style.padding = '0.5rem';
              checklistContainer.style.background = '#2a2a2a';
              checklistContainer.style.borderRadius = '0.25rem';
              checklistContainer.style.marginTop = '0.25rem';
              
              field.options.forEach(opt => {
                const optContainer = document.createElement('div');
                optContainer.style.display = 'flex';
                optContainer.style.alignItems = 'center';
                optContainer.style.gap = '0.25rem';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = opt.value;
                checkbox.checked = field.defaultValue?.includes(opt.value) || false;
                checkbox.style.width = 'auto';
                checkbox.style.cursor = 'pointer';
                
                const optLabel = document.createElement('label');
                optLabel.textContent = opt.label;
                optLabel.style.margin = '0';
                optLabel.style.cursor = 'pointer';
                optLabel.style.fontSize = '0.7rem';
                optLabel.style.color = '#d1d5db';
                
                optContainer.appendChild(checkbox);
                optContainer.appendChild(optLabel);
                checklistContainer.appendChild(optContainer);
              });
              
              inputForm.appendChild(checklistContainer);
              additionalInputs.push(checklistContainer);
              
            } else if (fieldType === 'typeAwareValue') {
              // Type-aware value input that adapts based on property dataType (category/name lookup)
              const typeAwareInput = createTypeAwareValueInput(
                inputForm, 
                field.categoryInputId || 'propCategory', 
                field.propertyInputId || 'propName'
              );
              inputForm.appendChild(typeAwareInput.container);
              // Store the typeAwareInput object for validation and value retrieval
              additionalInputs.push(typeAwareInput);
              
            } else if (fieldType === 'typeAwareValueByQualifiedProp') {
              // Type-aware value input that adapts based on qualified property ID
              const typeAwareInput = createTypeAwareValueInputByQualifiedProp(
                inputForm, 
                field.qualPropInputId || 'qualPropStr'
              );
              inputForm.appendChild(typeAwareInput.container);
              // Store the typeAwareInput object for validation and value retrieval
              additionalInputs.push(typeAwareInput);
              
            } else {
              // Text input field (or select for autocomplete)
              const label = document.createElement('label');
              label.textContent = field.label;
              label.style.marginTop = '0.5rem';
              
              let input;
              
              // Use select dropdown for autocomplete if schemas are loaded
              if (field.autocomplete && areSchemasLoaded()) {
                input = createAutocompleteSelect(field, inputForm);
              } else {
                // Regular text input (fallback when schemas not loaded or no autocomplete)
                input = document.createElement('input');
                input.type = 'text';
                input.id = field.id;
                input.placeholder = field.placeholder || '';
                const defaultVal = typeof field.defaultValue === 'function' 
                  ? field.defaultValue() 
                  : (field.defaultValue || '');
                input.value = defaultVal;
                input.className = 'w-full text-xs';
              }
              
              inputForm.appendChild(label);
              inputForm.appendChild(input);
              additionalInputs.push(input);
            }
          });
        }
      }
      
      // Add regex help if specified
      if (item.inputConfig.showRegexHelp) {
        const helpSection = document.createElement('div');
        helpSection.style.marginTop = '0.75rem';
        helpSection.style.padding = '0.5rem';
        helpSection.style.background = '#2a2a2a';
        helpSection.style.borderRadius = '0.25rem';
        helpSection.style.fontSize = '0.65rem';
        helpSection.style.lineHeight = '1.3';
        
        const helpTitle = document.createElement('div');
        helpTitle.style.fontWeight = 'bold';
        helpTitle.style.marginBottom = '0.25rem';
        helpTitle.style.color = '#9ca3af';
        helpTitle.textContent = 'RegEx Pattern Examples:';
        
        const helpTable = document.createElement('div');
        helpTable.style.fontFamily = 'monospace';
        helpTable.style.color = '#d1d5db';
        helpTable.innerHTML = `
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.5rem; margin-top: 0.25rem;">
            <span style="color: #10b981;">Concrete</span>
            <span>Contains "Concrete" anywhere</span>
            <span style="color: #10b981;">^Concrete</span>
            <span>Starts with "Concrete"</span>
            <span style="color: #10b981;">Steel$</span>
            <span>Ends with "Steel"</span>
            <span style="color: #10b981;">Concrete.*Wall</span>
            <span>"Concrete" then "Wall"</span>
            <span style="color: #10b981;">Concrete|Steel</span>
            <span>"Concrete" OR "Steel"</span>
          </div>
          <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #404040; color: #9ca3af;">
            <strong>Tip:</strong> For exact match, uncheck "Is Javascript RegEx?"
          </div>
        `;
        
        helpSection.appendChild(helpTitle);
        helpSection.appendChild(helpTable);
        inputForm.appendChild(helpSection);
      }
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '0.375rem';
      buttonContainer.style.marginTop = '0.5rem';
      
      // Execute button
      const executeBtn = document.createElement('button');
      executeBtn.textContent = 'Execute';
      executeBtn.className = 'flex-1 text-xs';
      
      // Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'flex-1 text-xs';
      cancelBtn.style.background = '#404040';
      
      executeBtn.addEventListener('click', async () => {
        executeBtn.disabled = true;
        executeBtn.textContent = 'Running...';
        
        try {
          // Gather all input values
          if (item.inputConfig.type === 'multiText') {
            // For multiText, gather values by field ID
            const values = {};
            item.inputConfig.fields.forEach(field => {
              const input = inputForm.querySelector(`#${field.id}`);
              if (input) {
                // Handle checkboxes differently from text inputs
                if (input.type === 'checkbox') {
                  values[field.id] = input.checked;
                } else {
                  values[field.id] = input.value;
                }
              }
            });
            await item.inputConfig.onExecute(values);
          } else if (item.inputConfig.additionalFields) {
            // For modelSelect with additionalFields, gather values as object
            const additionalValues = {};
            let validationError = null;
            
            item.inputConfig.additionalFields.forEach((field, idx) => {
              const fieldType = field.type || 'text';
              const inputElement = additionalInputs[idx];
              
              if (fieldType === 'checkbox') {
                additionalValues[field.id] = inputElement.checked;
              } else if (fieldType === 'checklist') {
                // Gather checked values from checklist
                const checkboxes = inputElement.querySelectorAll('input[type="checkbox"]:checked');
                const checkedValues = Array.from(checkboxes).map(cb => cb.value);
                additionalValues[field.id] = checkedValues.join(',');
              } else if (fieldType === 'typeAwareValue' || fieldType === 'typeAwareValueByQualifiedProp') {
                // Type-aware value input - validate and get value
                const validation = inputElement.validate();
                if (!validation.valid) {
                  validationError = validation.error;
                }
                additionalValues[field.id] = inputElement.getValue();
              } else {
                additionalValues[field.id] = inputElement.value;
              }
            });
            
            // Check for validation errors
            if (validationError) {
              console.error('Validation Error:', validationError);
              alert(validationError);
              return;
            }
            
            await item.inputConfig.onExecute(mainInput.value, additionalValues);
          } else {
            // For single field only
            await item.inputConfig.onExecute(mainInput.value);
          }
          
          // Collapse form after success
          inputForm.classList.add('hidden');
        } catch (error) {
          console.error('Error executing stub:', error);
        } finally {
          executeBtn.disabled = false;
          executeBtn.textContent = 'Execute';
        }
      });
      
      cancelBtn.addEventListener('click', () => {
        inputForm.classList.add('hidden');
      });
      
      buttonContainer.appendChild(executeBtn);
      buttonContainer.appendChild(cancelBtn);
      inputForm.appendChild(buttonContainer);
      
      // Button click toggles form visibility
      button.addEventListener('click', () => {
        inputForm.classList.toggle('hidden');
        // Refresh default values when opening (for text inputs and checkboxes, not selects)
        if (!inputForm.classList.contains('hidden')) {
          if (item.inputConfig.type === 'multiText') {
            // Refresh all multiText fields
            item.inputConfig.fields.forEach(field => {
              const input = inputForm.querySelector(`#${field.id}`);
              if (input) {
                if (input.tagName.toLowerCase() === 'input') {
                  if (input.type === 'checkbox') {
                    input.checked = field.defaultValue || false;
                  } else {
                    // Call function to get latest saved value
                    input.value = typeof field.defaultValue === 'function' 
                      ? field.defaultValue() 
                      : (field.defaultValue || '');
                  }
                } else if (input.tagName.toLowerCase() === 'select') {
                  // For select elements, try to set the saved value
                  const savedValue = typeof field.defaultValue === 'function' 
                    ? field.defaultValue() 
                    : (field.defaultValue || '');
                  if (savedValue) {
                    input.value = savedValue;
                  }
                }
              }
            });
          } else if (item.inputConfig.type === 'groupSelect') {
            // Refresh group dropdown options from cache
            if (mainInput.tagName.toLowerCase() === 'select') {
              mainInput.innerHTML = '';
              const groups = getGroupsForDropdown();
              if (groups.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '-- No groups available --';
                mainInput.appendChild(option);
              } else {
                groups.forEach((group, index) => {
                  const option = document.createElement('option');
                  option.value = group.urn;
                  const displayName = group.name || 'Unnamed Group';
                  option.textContent = `${displayName} - ${group.urn}`;
                  if (index === 0) option.selected = true;
                  mainInput.appendChild(option);
                });
              }
            }
          } else if (item.inputConfig.type !== 'modelSelect') {
            // Refresh single text input
            if (mainInput.tagName.toLowerCase() === 'input') {
              mainInput.value = typeof item.inputConfig.defaultValue === 'function' 
                ? item.inputConfig.defaultValue() 
                : item.inputConfig.defaultValue;
            }
          }
        }
      });
      
      itemContainer.appendChild(button);
      itemContainer.appendChild(inputForm);
    } else {
      // Regular item without input
      button.addEventListener('click', async () => {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = `${originalText} (running...)`;
        
        try {
          await item.action();
        } catch (error) {
          console.error('Error executing stub:', error);
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
      
      itemContainer.appendChild(button);
    }
    
    content.appendChild(itemContainer);
  });
  
  // Toggle visibility on click
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    content.classList.toggle('show');
  });
  
  dropdown.appendChild(toggle);
  dropdown.appendChild(content);
  
  return dropdown;
}

/**
 * Create a STUB with input form (for future use with stubs that need parameters)
 * 
 * Example usage for a stub that needs a User ID:
 * 
 * const stub = createStubWithInput(
 *   'GET User Access Level',
 *   'Get access level for a specific user',
 *   [{ label: 'User ID', placeholder: 'Enter user ID...', id: 'userId' }],
 *   (inputs) => {
 *     const userId = inputs.userId;
 *     return facilityStubs.getFacilityUserAccessLevel(currentFacilityURN, currentFacilityRegion, userId);
 *   }
 * );
 * 
 * @param {string} label - Button label
 * @param {string} description - Description
 * @param {Array} inputFields - Array of {label, placeholder, id} objects
 * @param {Function} onExecute - Function to call with inputs object
 * @returns {HTMLElement} Stub element with expandable input form
 */
export function createStubWithInput(label, description, inputFields, onExecute) {
  const wrapper = document.createElement('div');
  wrapper.className = 'stub-section';
  
  const button = document.createElement('button');
  button.className = 'stub-button';
  button.textContent = label;
  button.title = description;
  
  const inputFormId = `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputForm = document.createElement('div');
  inputForm.id = inputFormId;
  inputForm.className = 'stub-input-form hidden';
  
  // Create input fields
  const inputs = {};
  inputFields.forEach(field => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = field.placeholder;
    input.id = `${inputFormId}-${field.id}`;
    input.className = 'w-full';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.className = 'block text-xs text-dark-text mb-1';
    label.htmlFor = input.id;
    
    inputForm.appendChild(label);
    inputForm.appendChild(input);
    
    inputs[field.id] = input;
  });
  
  // Create execute button
  const executeBtn = document.createElement('button');
  executeBtn.textContent = 'Execute';
  executeBtn.className = 'mt-2';
  
  executeBtn.addEventListener('click', async () => {
    executeBtn.disabled = true;
    executeBtn.textContent = 'Executing...';
    
    try {
      // Gather input values
      const values = {};
      Object.entries(inputs).forEach(([id, input]) => {
        values[id] = input.value;
      });
      
      // Execute the STUB function
      await onExecute(values);
    } catch (error) {
      console.error('Error executing stub:', error);
    } finally {
      executeBtn.disabled = false;
      executeBtn.textContent = 'Execute';
    }
  });
  
  inputForm.appendChild(executeBtn);
  
  // Toggle visibility on button click
  button.addEventListener('click', () => {
    inputForm.classList.toggle('hidden');
  });
  
  const hint = document.createElement('span');
  hint.className = 'console-hint';
  hint.textContent = 'Check console for output';
  
  wrapper.appendChild(button);
  wrapper.appendChild(hint);
  wrapper.appendChild(inputForm);
  
  return wrapper;
}

