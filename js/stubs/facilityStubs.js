/**
 * Facility STUB Functions
 * 
 * EDUCATIONAL PURPOSE:
 * These STUB functions demonstrate how to call Tandem REST API endpoints.
 * They are intentionally simple and verbose to help developers understand:
 * - How to construct API URLs
 * - What headers are needed
 * - What the request/response looks like
 * 
 * All output goes to the browser console (F12 or Cmd+Option+I) so developers
 * can inspect the raw API responses and learn the data structures.
 */

import { tandemBaseURL, makeRequestOptionsGET, logResponse } from '../api.js';

/**
 * GET Facility Info
 * 
 * API Endpoint: GET /twins/{facilityURN}
 * Returns: Complete facility information including properties, template, links to models, etc.
 * 
 * LEARN:
 * - This is one of the most basic Tandem API calls
 * - It returns metadata about a facility (not the 3D model data)
 * - The response includes Identity Data (building name, address, etc.)
 * - The "links" array contains URNs of all models in this facility
 * 
 * @param {string} facilityURN - Facility URN (e.g., 'urn:adsk.dtt:...')
 * @param {string} region - Region header ('US', 'EMEA', or 'AUS')
 */
export async function getFacilityInfo(facilityURN, region) {
  console.group("🔍 STUB: getFacilityInfo()");
  console.log("📋 Purpose: Get complete facility information");
  console.log("📚 API Docs: https://aps.autodesk.com/en/docs/tandem/v1/reference/http/facilities-twins-id-GET/");
  
  // Step 1: Construct the API URL
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}`;
  console.log("🌐 Request URL:", requestPath);
  console.log("🗺️  Region:", region);
  
  // Step 2: Log what we're about to do
  console.log("⚙️  Method: GET");
  console.log("🔑 Auth: Bearer token (from session storage)");
  
  try {
    // Step 3: Make the API call
    console.log("📤 Sending request...");
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    
    // Step 4: Check if request was successful
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Step 5: Parse the JSON response
    const data = await response.json();
    
    // Step 6: Log the response for educational inspection
    console.log("✅ Success! API returned facility info:");
    logResponse(data, "📦 Facility Data");
    
    // Step 7: Highlight key parts of the response
    console.log("\n🔎 Key Information:");
    console.log("  • Building Name:", data.props?.["Identity Data"]?.["Building Name"]);
    console.log("  • Template:", data.template?.name || "None");
    console.log("  • Schema Version:", data.schemaVersion);
    console.log("  • Number of Models:", data.links?.length || 0);
    console.log("  • Region:", data.region);
    
    // Step 8: Show model URNs if available
    if (data.links && data.links.length > 0) {
      console.log("\n📁 Models in this facility:");
      data.links.forEach((link, index) => {
        const isDefault = link.modelId.includes(':dtm:');
        console.log(`  ${index + 1}. ${link.modelId} ${isDefault ? '(default model)' : ''}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("💡 Tip: Check the Network tab in DevTools for more details");
  }
  
  console.groupEnd();
}

/**
 * GET Facility Template
 * 
 * API Endpoint: GET /twins/{facilityURN}/template
 * Returns: The facility template information (classification system, parameters, etc.)
 * 
 * LEARN:
 * - Templates define the classification structure (like Uniformat)
 * - They also define custom parameters that can be used in the facility
 * - This is separate from the facility info call
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 */
export async function getFacilityTemplate(facilityURN, region) {
  console.group("🔍 STUB: getFacilityTemplate()");
  console.log("📋 Purpose: Get facility template (classification system & parameters)");
  console.log("📚 API Docs: https://aps.autodesk.com/en/docs/tandem/v1/reference/http/facilities-twins-id-template-GET/");
  
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}/template`;
  console.log("🌐 Request URL:", requestPath);
  console.log("🗺️  Region:", region);
  console.log("⚙️  Method: GET");
  
  try {
    console.log("📤 Sending request...");
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Success! Template data:");
    logResponse(data, "📦 Template Data");
    
    console.log("\n🔎 Template contains:");
    console.log("  • Name:", data.name || "Unnamed");
    console.log("  • Description:", data.desc || "No description");
    console.log("  • Has Classifications:", !!data.classificationId);
    console.log("  • Has Parameters:", !!data.parametersId);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.groupEnd();
}

/**
 * GET Facility Users
 * 
 * API Endpoint: GET /twins/{facilityURN}/users
 * Returns: List of users who have access to this facility and their permission levels
 * 
 * LEARN:
 * - Shows who has access to the facility
 * - Includes permission levels (admin, edit, view)
 * - Useful for understanding access control
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 */
export async function getFacilityUsers(facilityURN, region) {
  console.group("🔍 STUB: getFacilityUsers()");
  console.log("📋 Purpose: Get list of users with access to this facility");
  
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}/users`;
  console.log("🌐 Request URL:", requestPath);
  console.log("🗺️  Region:", region);
  console.log("⚙️  Method: GET");
  
  try {
    console.log("📤 Sending request...");
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Success! Users data:");
    logResponse(data, "📦 Users Data");
    
    if (Array.isArray(data) && data.length > 0) {
      console.log("\n🔎 Access Summary:");
      const accessCounts = data.reduce((acc, user) => {
        acc[user.accessLevel] = (acc[user.accessLevel] || 0) + 1;
        return acc;
      }, {});
      Object.entries(accessCounts).forEach(([level, count]) => {
        console.log(`  • ${level}: ${count} user(s)`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.groupEnd();
}

/**
 * GET Saved Views
 * 
 * API Endpoint: GET /twins/{facilityURN}/views
 * Returns: List of saved views (camera positions, element visibility, etc.)
 * 
 * LEARN:
 * - Saved views capture camera position, visible/hidden elements, etc.
 * - Each view has a UUID that can be used to retrieve it individually
 * - Views are created by users in the Tandem web application
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 */
export async function getSavedViews(facilityURN, region) {
  console.group("🔍 STUB: getSavedViews()");
  console.log("📋 Purpose: Get list of saved views for this facility");
  
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}/views`;
  console.log("🌐 Request URL:", requestPath);
  console.log("🗺️  Region:", region);
  console.log("⚙️  Method: GET");
  
  try {
    console.log("📤 Sending request...");
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Success! Saved views:");
    logResponse(data, "📦 Views Data");
    
    if (Array.isArray(data) && data.length > 0) {
      console.log("\n🔎 Views Summary:");
      data.forEach((view, index) => {
        console.log(`  ${index + 1}. "${view.name || 'Unnamed'}" (UUID: ${view.id})`);
      });
    } else {
      console.log("  No saved views found");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.groupEnd();
}

