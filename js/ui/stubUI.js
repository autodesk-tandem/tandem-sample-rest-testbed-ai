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

// Store current facility context for STUB functions
let currentFacilityURN = null;
let currentFacilityRegion = null;

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
export function renderStubs(container, facilityURN, region) {
  // Store context
  currentFacilityURN = facilityURN;
  currentFacilityRegion = region;
  
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
      label: 'GET Facility Users',
      action: () => facilityStubs.getFacilityUsers(currentFacilityURN, currentFacilityRegion)
    },
    {
      label: 'GET Saved Views',
      action: () => facilityStubs.getSavedViews(currentFacilityURN, currentFacilityRegion)
    }
  ]);
  
  container.appendChild(facilityDropdown);
  
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
 * @param {Array} items - Array of {label, action} objects
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
  items.forEach(item => {
    const button = document.createElement('button');
    button.className = 'dropdown-item';
    button.textContent = item.label;
    
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
    
    content.appendChild(button);
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

