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
import { getDefaultModelURN, getModels } from '../api.js';

// Store current facility context for STUB functions
let currentFacilityURN = null;
let currentFacilityRegion = null;
let currentModels = [];

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
  
  // Add a help message at the bottom
  const helpDiv = document.createElement('div');
  helpDiv.className = 'mt-4 p-3 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-secondary';
  helpDiv.innerHTML = `
    <strong class="text-dark-text">💡 Developer Tips:</strong><br>
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
      inputForm.style.margin = '0.5rem';
      inputForm.style.marginTop = '0';
      
      // Main input field (text input or model selector)
      const mainLabel = document.createElement('label');
      mainLabel.textContent = item.inputConfig.label;
      mainLabel.className = 'block text-xs text-dark-text mb-1';
      
      let mainInput;
      if (item.inputConfig.type === 'modelSelect') {
        // Create a dropdown for model selection
        mainInput = document.createElement('select');
        mainInput.className = 'w-full text-xs';
        
        // Populate with models
        const defaultModelURN = getDefaultModelURN(currentFacilityURN);
        currentModels.forEach(model => {
          const option = document.createElement('option');
          option.value = model.modelId;
          
          const isDefault = model.modelId === defaultModelURN;
          const displayName = model.label || (isDefault ? '** Default Model **' : 'Untitled Model');
          option.textContent = displayName;
          
          // Pre-select the default model
          if (isDefault) {
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
      const additionalInputs = [];
      if (item.inputConfig.additionalFields) {
        item.inputConfig.additionalFields.forEach(field => {
          const label = document.createElement('label');
          label.textContent = field.label;
          label.className = 'block text-xs text-dark-text mb-1 mt-2';
          
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
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex gap-2 mt-2';
      
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
          const values = [mainInput.value, ...additionalInputs.map(inp => inp.value)];
          await item.inputConfig.onExecute(...values);
          
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
        // Refresh default value when opening (for text inputs only, not selects)
        if (!inputForm.classList.contains('hidden') && item.inputConfig.type !== 'modelSelect') {
          if (mainInput.tagName.toLowerCase() === 'input') {
            mainInput.value = typeof item.inputConfig.defaultValue === 'function' 
              ? item.inputConfig.defaultValue() 
              : item.inputConfig.defaultValue;
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
  hint.textContent = '💡 Check console for output';
  
  wrapper.appendChild(button);
  wrapper.appendChild(hint);
  wrapper.appendChild(inputForm);
  
  return wrapper;
}

