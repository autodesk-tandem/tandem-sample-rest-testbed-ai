/**
 * Main Application Entry Point
 * 
 * This orchestrates the login flow, facility selection, and STUB function UI.
 * Designed to be simple and easy to understand for developers learning the Tandem API.
 */

import { login, logout, checkLogin } from './auth.js';
import { 
  getUserResources,
  getFacilitiesForGroup,
  getFacilityInfo,
  getFacilityThumbnail,
  registerThumbnailURL,
  cleanupThumbnailURLs
} from './api.js';
import { RegionLabelMap } from '../tandem/constants.js';
import { renderStubs } from './ui/stubUI.js';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfileLink = document.getElementById('userProfileLink');
const userProfileImg = document.getElementById('userProfileImg');
const accountSelect = document.getElementById('accountSelect');
const facilitySelect = document.getElementById('facilitySelect');
const welcomeMessage = document.getElementById('welcomeMessage');
const dashboardContent = document.getElementById('dashboardContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const facilityInfo = document.getElementById('facilityInfo');
const stubsContainer = document.getElementById('stubsContainer');

// State
let accounts = [];
let currentFacilityURN = null;
let currentFacilityRegion = null;
let userResourcesCache = null;
let facilityRegionMap = new Map();

/**
 * Toggle loading overlay
 * @param {boolean} show - Show or hide the loading overlay
 */
function toggleLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

/**
 * Update UI based on login state
 * @param {boolean} loggedIn - Whether user is logged in
 * @param {string} profileImg - URL to user's profile image
 */
function updateUIForLoginState(loggedIn, profileImg) {
  if (loggedIn) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
    
    if (profileImg) {
      userProfileImg.src = profileImg;
      userProfileLink.classList.remove('hidden');
    }
    
    accountSelect.classList.remove('hidden');
    facilitySelect.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userProfileLink.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
    accountSelect.classList.add('hidden');
    facilitySelect.classList.add('hidden');
  }
}

/**
 * Load and cache user resources (facilities and groups)
 * 
 * This single API call returns all facilities and groups across all regions.
 * Much more efficient than querying each region separately.
 */
async function loadUserResourcesCache() {
  try {
    console.log('📊 Loading user resources...');
    const startTime = Date.now();
    
    userResourcesCache = await getUserResources('@me');
    
    // Build facility region map for quick lookups
    facilityRegionMap.clear();
    if (userResourcesCache?.twins) {
      userResourcesCache.twins.forEach(twin => {
        facilityRegionMap.set(twin.urn, twin.region || 'us');
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ User resources loaded in ${duration}ms`);
  } catch (error) {
    console.error('Error loading user resources:', error);
    userResourcesCache = { twins: [], groups: [] };
  }
}

/**
 * Build accounts and facilities data structure from cached user resources
 */
async function buildAccountsAndFacilities() {
  try {
    // Ensure cache is loaded
    if (!userResourcesCache) {
      await loadUserResourcesCache();
    }
    
    const accounts = [];
    const { twins = [], groups = [] } = userResourcesCache;
    
    // Group facility URNs by their grantedViaGroup
    const facilityUrnsByGroup = new Map();
    const directlySharedUrns = [];
    
    twins.forEach(twin => {
      if (twin.grantedViaGroup) {
        if (!facilityUrnsByGroup.has(twin.grantedViaGroup)) {
          facilityUrnsByGroup.set(twin.grantedViaGroup, []);
        }
        facilityUrnsByGroup.get(twin.grantedViaGroup).push(twin.urn);
      } else {
        directlySharedUrns.push(twin.urn);
      }
    });

    // Build accounts from groups (facilities lazy loaded)
    for (const group of groups) {
      const urns = facilityUrnsByGroup.get(group.urn) || [];
      
      accounts.push({
        id: group.urn,
        name: group.name || 'Unnamed Account',
        facilityCount: urns.length,
        facilities: null // Lazy loaded when dropdown is populated
      });
    }

    // Add directly shared facilities account if any exist
    if (directlySharedUrns.length > 0) {
      accounts.push({
        id: '@me',
        name: '** SHARED DIRECTLY **',
        facilityCount: directlySharedUrns.length,
        facilities: null // Lazy loaded when dropdown is populated
      });
    }

    return accounts;
  } catch (error) {
    console.error('Error building accounts and facilities:', error);
    return [];
  }
}

/**
 * Populate accounts dropdown
 */
async function populateAccountsDropdown(accounts) {
  accountSelect.innerHTML = '<option value="">Select Account...</option>';
  
  // Sort accounts alphabetically, but keep "** SHARED DIRECTLY **" at the end
  const sortedAccounts = [...accounts].sort((a, b) => {
    const sharedDirectlyName = '** SHARED DIRECTLY **';
    if (a.name === sharedDirectlyName) return 1;
    if (b.name === sharedDirectlyName) return -1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  
  sortedAccounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.name;
    option.textContent = account.name;
    accountSelect.appendChild(option);
  });

  // Try to restore last selected account, or select the first one
  const lastAccount = window.localStorage.getItem('tandem-testbed-ai-last-account');
  let selectedAccount = null;
  
  if (lastAccount && accounts.some(a => a.name === lastAccount)) {
    selectedAccount = lastAccount;
  } else if (sortedAccounts.length > 0) {
    selectedAccount = sortedAccounts[0].name;
  }
  
  if (selectedAccount) {
    accountSelect.value = selectedAccount;
    await populateFacilitiesDropdown(accounts, selectedAccount);
    
    // Remove placeholder after selection
    const placeholder = accountSelect.querySelector('option[value=""]');
    if (placeholder) placeholder.remove();
  }
}

/**
 * Get the last used facility for a specific account
 */
function getLastFacilityForAccount(accountName) {
  try {
    const facilitiesJson = window.localStorage.getItem('tandem-testbed-ai-last-facilities');
    if (!facilitiesJson) return null;
    
    const facilitiesMap = JSON.parse(facilitiesJson);
    return facilitiesMap[accountName] || null;
  } catch (error) {
    console.error('Error reading last facilities from localStorage:', error);
    return null;
  }
}

/**
 * Set the last used facility for a specific account
 */
function setLastFacilityForAccount(accountName, facilityURN) {
  try {
    const facilitiesJson = window.localStorage.getItem('tandem-testbed-ai-last-facilities');
    const facilitiesMap = facilitiesJson ? JSON.parse(facilitiesJson) : {};
    
    facilitiesMap[accountName] = facilityURN;
    window.localStorage.setItem('tandem-testbed-ai-last-facilities', JSON.stringify(facilitiesMap));
  } catch (error) {
    console.error('Error saving last facilities to localStorage:', error);
  }
}

/**
 * Populate facilities dropdown based on selected account
 */
async function populateFacilitiesDropdown(accounts, accountName) {
  facilitySelect.innerHTML = '<option value="">Select Facility...</option>';
  
  const account = accounts.find(a => a.name === accountName);
  if (!account) return;

  // If facilities are not loaded, load them now with names
  if (!account.facilities) {
    const { twins = [] } = userResourcesCache;
    const accountFacilities = account.id === '@me' 
      ? twins.filter(t => !t.grantedViaGroup)
      : twins.filter(t => t.grantedViaGroup === account.id);
    
    if (accountFacilities.length === 0) {
      account.facilities = [];
    } else {
      console.log(`📍 Fetching facilities for ${accountName}...`);
      
      const facilitiesObj = await getFacilitiesForGroup(account.id);
      
      // Extract facility names from API response
      const facilities = facilitiesObj ? Object.entries(facilitiesObj).map(([urn, settings]) => ({
          urn,
          name: settings?.props?.["Identity Data"]?.["Building Name"] || 'Unnamed Facility',
          region: settings?.region || 'us'
        })) : [];

      // Cache for future use
      account.facilities = facilities;
    }
  }
  
  if (account.facilities.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No facilities available';
    option.disabled = true;
    facilitySelect.appendChild(option);
    return;
  }
  
  // Sort facilities alphabetically by name
  const sortedFacilities = [...account.facilities].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
  
  sortedFacilities.forEach(facility => {
    const option = document.createElement('option');
    option.value = facility.urn;
    option.textContent = facility.name;
    facilitySelect.appendChild(option);
  });

  // Try to restore last selected facility for THIS account, or select the first one
  const lastFacility = getLastFacilityForAccount(accountName);
  let selectedFacilityURN = null;
  
  if (lastFacility && account.facilities.some(f => f.urn === lastFacility)) {
    selectedFacilityURN = lastFacility;
  } else if (sortedFacilities.length > 0) {
    selectedFacilityURN = sortedFacilities[0].urn;
  }
  
  if (selectedFacilityURN) {
    facilitySelect.value = selectedFacilityURN;
    loadFacility(selectedFacilityURN);
    
    // Remove placeholder after selection
    const placeholder = facilitySelect.querySelector('option[value=""]');
    if (placeholder) placeholder.remove();
  }
}

/**
 * Load facility information and render STUB functions
 */
async function loadFacility(facilityURN) {
  if (currentFacilityURN === facilityURN) {
    return; // Already loaded
  }
  currentFacilityURN = facilityURN;
  
  // Get region from cache (instant lookup, no API call needed!)
  const region = facilityRegionMap.get(facilityURN) || 'us';
  currentFacilityRegion = RegionLabelMap[region] || 'US';
  
  toggleLoading(true);
  
  try {
    // Get facility info and thumbnail in parallel
    const [info, thumbnailUrl] = await Promise.all([
      getFacilityInfo(facilityURN, currentFacilityRegion),
      getFacilityThumbnail(facilityURN, currentFacilityRegion)
    ]);
    
    // Register thumbnail URL for cleanup
    if (thumbnailUrl) {
      registerThumbnailURL(thumbnailUrl);
    }
    
    if (info) {
      const buildingName = info.props?.["Identity Data"]?.["Building Name"] || "Unknown";
      const location = info.props?.["Identity Data"]?.["Address"] || null;
      const regionInfo = info.region || null;
      
      facilityInfo.innerHTML = `
        <div class="flex flex-col md:flex-row gap-4">
          ${thumbnailUrl ? `
          <div class="flex-shrink-0">
            <img src="${thumbnailUrl}" 
                 alt="Facility Thumbnail" 
                 class="w-full md:w-48 h-32 object-cover rounded border border-dark-border">
          </div>
          ` : ''}
          <div class="flex-grow space-y-1">
            <div>
              <span class="font-medium text-dark-text text-xs">Building:</span>
              <span class="text-dark-text-secondary ml-2 text-xs">${buildingName}</span>
            </div>
            ${location ? `
            <div>
              <span class="font-medium text-dark-text text-xs">Location:</span>
              <span class="text-dark-text-secondary ml-2 text-xs">${location}</span>
            </div>
            ` : ''}
            ${regionInfo ? `
            <div>
              <span class="font-medium text-dark-text text-xs">Region:</span>
              <span class="text-dark-text-secondary ml-2 text-xs">${regionInfo}</span>
            </div>
            ` : ''}
            <div>
              <span class="font-medium text-dark-text text-xs">URN:</span>
              <span class="text-dark-text-secondary ml-2 text-xs font-mono break-all">${facilityURN}</span>
            </div>
          </div>
        </div>
      `;
      
      // Render STUB functions UI
      renderStubs(stubsContainer, facilityURN, currentFacilityRegion);
    }
  } catch (error) {
    console.error('Error loading facility:', error);
    facilityInfo.innerHTML = `<p class="text-red-600">Error loading facility information</p>`;
  } finally {
    toggleLoading(false);
  }
}

/**
 * Initialize the application
 */
async function initialize() {
  // Set up event listeners
  loginBtn.addEventListener('click', login);
  logoutBtn.addEventListener('click', logout);

  accountSelect.addEventListener('change', async (e) => {
    const accountName = e.target.value;
    if (accountName) {
      window.localStorage.setItem('tandem-testbed-ai-last-account', accountName);
      await populateFacilitiesDropdown(accounts, accountName);
      // Remove placeholder after selection
      const placeholder = accountSelect.querySelector('option[value=""]');
      if (placeholder) placeholder.remove();
    }
  });

  facilitySelect.addEventListener('change', (e) => {
    const facilityURN = e.target.value;
    if (facilityURN) {
      // Save last facility per account
      const accountName = accountSelect.value;
      if (accountName) {
        setLastFacilityForAccount(accountName, facilityURN);
      }
      loadFacility(facilityURN);
      // Remove placeholder after selection
      const placeholder = facilitySelect.querySelector('option[value=""]');
      if (placeholder) placeholder.remove();
    }
  });

  // Check login status
  toggleLoading(true);
  const { loggedIn, profileImg } = await checkLogin();
  
  if (loggedIn) {
    updateUIForLoginState(true, profileImg);
    
    // Load user resources cache first (single API call for all data)
    await loadUserResourcesCache();
    
    // Build accounts and facilities from cached data
    accounts = await buildAccountsAndFacilities();
    
    if (accounts && accounts.length > 0) {
      await populateAccountsDropdown(accounts);
    } else {
      facilityInfo.innerHTML = '<p class="text-red-600">No accounts or facilities found. Please ensure you have access to at least one Tandem facility.</p>';
    }
  } else {
    updateUIForLoginState(false, null);
  }
  
  toggleLoading(false);
}

// Clean up blob URLs when page is unloaded to prevent memory leaks
window.addEventListener('beforeunload', () => {
  cleanupThumbnailURLs();
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for use by STUB functions
export { currentFacilityURN, currentFacilityRegion };

