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
 * STUB functions organized by category.
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
  
  // Render Facility stubs section
  const facilitySection = createStubCategory(
    'Facility API Endpoints',
    'Information about the facility, users, templates, and saved views'
  );
  
  // Add facility stub buttons
  facilitySection.appendChild(createStubButton(
    'GET Facility Info',
    'Get complete facility information including properties and models',
    () => facilityStubs.getFacilityInfo(currentFacilityURN, currentFacilityRegion)
  ));
  
  facilitySection.appendChild(createStubButton(
    'GET Facility Template',
    'Get facility template with classification and parameters',
    () => facilityStubs.getFacilityTemplate(currentFacilityURN, currentFacilityRegion)
  ));
  
  facilitySection.appendChild(createStubButton(
    'GET Facility Users',
    'Get list of users with access to this facility',
    () => facilityStubs.getFacilityUsers(currentFacilityURN, currentFacilityRegion)
  ));
  
  facilitySection.appendChild(createStubButton(
    'GET Saved Views',
    'Get list of saved views (camera positions, visibility)',
    () => facilityStubs.getSavedViews(currentFacilityURN, currentFacilityRegion)
  ));
  
  container.appendChild(facilitySection);
  
  // Add a help message at the bottom
  const helpDiv = document.createElement('div');
  helpDiv.className = 'mt-4 p-3 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-secondary';
  helpDiv.innerHTML = `
    <strong class="text-dark-text">💡 Developer Tips:</strong><br>
    • Open Chrome DevTools (F12 or Cmd+Option+I) to see API requests and responses<br>
    • Click any button above to execute that API call<br>
    • All output is logged to the console with detailed explanations<br>
    • Check the Network tab to see the actual HTTP requests<br>
    • Responses are expandable in the console - drill down to explore the data structures
  `;
  container.appendChild(helpDiv);
}

/**
 * Create a category section for organizing STUB functions
 * 
 * @param {string} title - Category title
 * @param {string} description - Category description
 * @returns {HTMLElement} Category section element
 */
function createStubCategory(title, description) {
  const section = document.createElement('div');
  section.className = 'mb-4';
  
  const header = document.createElement('div');
  header.className = 'mb-2';
  header.innerHTML = `
    <h3 class="text-sm font-semibold text-tandem-blue">${title}</h3>
    <p class="text-xs text-dark-text-secondary mt-1">${description}</p>
  `;
  
  section.appendChild(header);
  return section;
}

/**
 * Create a STUB button with hover info
 * 
 * @param {string} label - Button label
 * @param {string} description - Description shown on hover
 * @param {Function} onClick - Function to call when clicked
 * @returns {HTMLElement} Button element
 */
function createStubButton(label, description, onClick) {
  const wrapper = document.createElement('div');
  wrapper.className = 'stub-section';
  
  const button = document.createElement('button');
  button.className = 'stub-button';
  button.textContent = label;
  button.title = description;
  
  button.addEventListener('click', async () => {
    // Disable button during execution
    button.disabled = true;
    button.textContent = `${label} (running...)`;
    
    try {
      // Execute the STUB function
      await onClick();
    } catch (error) {
      console.error('Error executing stub:', error);
    } finally {
      // Re-enable button
      button.disabled = false;
      button.textContent = label;
    }
  });
  
  const hint = document.createElement('span');
  hint.className = 'console-hint';
  hint.textContent = '💡 Check console for output';
  
  wrapper.appendChild(button);
  wrapper.appendChild(hint);
  
  return wrapper;
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

