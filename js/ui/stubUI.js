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
import { getDefaultModelURN, getModels } from '../api.js';
import { getUniqueCategoryNames, getUniquePropertyNames, areSchemasLoaded } from '../state/schemaCache.js';

// Store current facility context for STUB functions
let currentFacilityURN = null;
let currentFacilityRegion = null;
let currentModels = [];

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
      label: 'GET User Access Levels',
      action: () => facilityStubs.getFacilityUsers(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Facility Thumbnail',
      action: () => facilityStubs.getThumbnail(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Saved Views',
      action: () => facilityStubs.getSavedViews(currentFacilityURN, currentFacilityRegion)
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
            placeholder: 'Leave empty for entire model',
            defaultValue: ''
          }
        ],
        onExecute: (modelUrn, elemKeys) => modelStubs.getModelDataFragments(modelUrn, currentFacilityRegion, elemKeys || '')
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
    }
  ]);
  
  container.appendChild(propertyDropdown);
  
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
            // Text input field
            const label = document.createElement('label');
            label.textContent = field.label;
            if (fieldIdx > 0) label.style.marginTop = '0.5rem';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = field.id;
            input.placeholder = field.placeholder || '';
            input.value = typeof field.defaultValue === 'function' 
              ? field.defaultValue() 
              : (field.defaultValue || '');
            input.className = 'w-full text-xs';
            
            inputForm.appendChild(label);
            inputForm.appendChild(input);
            
            // Add autocomplete datalist if specified and schemas are loaded
            if (field.autocomplete && areSchemasLoaded()) {
              console.log(`Adding autocomplete for ${field.id}, type: ${field.autocomplete}`);
              const datalistId = generateDatalistId();
              input.setAttribute('list', datalistId);
              
              const datalist = document.createElement('datalist');
              datalist.id = datalistId;
              
              let options = [];
              if (field.autocomplete === 'category') {
                options = getUniqueCategoryNames();
                console.log(`  Found ${options.length} unique categories`);
              } else if (field.autocomplete === 'property') {
                // Get properties, optionally filtered by category
                const categoryInput = inputForm.querySelector('#categoryName');
                const categoryFilter = categoryInput ? categoryInput.value : null;
                options = getUniquePropertyNames(categoryFilter);
                console.log(`  Found ${options.length} unique properties`);
                
                // Update property options when category changes
                if (categoryInput) {
                  categoryInput.addEventListener('input', () => {
                    const newOptions = getUniquePropertyNames(categoryInput.value || null);
                    datalist.innerHTML = '';
                    newOptions.forEach(opt => {
                      const option = document.createElement('option');
                      option.value = opt;
                      datalist.appendChild(option);
                    });
                    console.log(`  Property list updated: ${newOptions.length} options for category "${categoryInput.value}"`);
                  });
                }
              }
              
              options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                datalist.appendChild(option);
              });
              
              inputForm.appendChild(datalist);
            } else if (field.autocomplete) {
              console.log(`Autocomplete requested for ${field.id} but schemas not loaded yet`);
            }
            
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
            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.marginTop = '0.5rem';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = field.placeholder;
            input.value = field.defaultValue || '';
            input.className = 'w-full text-xs';
            
            inputForm.appendChild(label);
            inputForm.appendChild(input);
            additionalInputs.push(input);
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
          } else {
            // For single field + additional fields, pass as array
            const values = [mainInput.value, ...additionalInputs.map(inp => inp.value)];
            await item.inputConfig.onExecute(...values);
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
              if (input && input.tagName.toLowerCase() === 'input') {
                if (input.type === 'checkbox') {
                  input.checked = field.defaultValue || false;
                } else {
                  // Call function to get latest saved value
                  input.value = typeof field.defaultValue === 'function' 
                    ? field.defaultValue() 
                    : (field.defaultValue || '');
                }
              }
            });
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

