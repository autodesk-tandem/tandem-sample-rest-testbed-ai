/**
 * Core API utilities for Tandem REST API Testbed
 * 
 * This module provides foundational functions for making API calls to Tandem.
 * It's designed to be simple and transparent for educational purposes.
 */

import { getEnv } from './config.js';
import { RegionLabelMap } from '../tandem/constants.js';

const env = getEnv();

// Base URLs for Tandem API endpoints
export const tandemBaseURL = env.tandemDbBaseURL;
export const tandemAppBaseURL = env.tandemAppBaseURL;

/**
 * Create request options for GET requests
 * @param {string} region - Region header (e.g., 'US', 'EMEA', 'AUS')
 * @returns {object} Fetch request options
 */
export function makeRequestOptionsGET(region = null) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${window.sessionStorage.token}`);
  
  if (region) {
    headers.append("Region", region);
  }
  
  return {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  };
}

/**
 * Create request options for POST requests
 * @param {string} bodyPayload - JSON string body
 * @param {string} region - Region header (e.g., 'US', 'EMEA', 'AUS')
 * @returns {object} Fetch request options
 */
export function makeRequestOptionsPOST(bodyPayload, region = null) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${window.sessionStorage.token}`);
  headers.append("Content-Type", "application/json");
  
  if (region) {
    headers.append("Region", region);
  }
  
  return {
    method: 'POST',
    headers: headers,
    body: bodyPayload,
    redirect: 'follow'
  };
}

/**
 * Get user resources (facilities and groups)
 * 
 * PERFORMANCE NOTE: This single API call returns ALL facilities and groups
 * across all regions, which is much more efficient than querying each region separately.
 * 
 * @param {string} userId - User ID (typically '@me')
 * @returns {Promise<object>} User resources with twins and groups
 */
export async function getUserResources(userId) {
  const requestPath = `${tandemBaseURL}/users/${userId}/resources`;
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user resources:', error);
    return null;
  }
}

/**
 * Get groups (accounts/teams)
 * @returns {Promise<Array>} Array of groups
 */
export async function getGroups() {
  const requestPath = `${tandemBaseURL}/groups`;
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

/**
 * Get facilities for a group, handling multi-region queries
 * 
 * @param {string} groupId - Group URN or '@me' for directly shared facilities
 * @returns {Promise<object>} Facilities object keyed by URN
 */
export async function getFacilitiesForGroup(groupId) {
  const regions = ['US', 'EMEA', 'AUS'];
  const facilities = {};
  
  // Determine the endpoint based on groupId
  const endpoint = groupId === '@me' 
    ? `${tandemBaseURL}/users/@me/twins`
    : `${tandemBaseURL}/groups/${groupId}/twins`;
  
  // Query all regions in parallel
  const promises = regions.map(async (region) => {
    try {
      const response = await fetch(endpoint, makeRequestOptionsGET(region));
      if (response.ok) {
        const data = await response.json();
        // Add region info to each facility
        for (const [urn, settings] of Object.entries(data)) {
          facilities[urn] = { ...settings, region: region.toLowerCase() };
        }
      }
    } catch (error) {
      console.warn(`Error fetching facilities for region ${region}:`, error);
    }
  });
  
  await Promise.all(promises);
  return facilities;
}

/**
 * Get facility information
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region (e.g., 'US', 'EMEA', 'AUS')
 * @returns {Promise<object>} Facility info
 */
export async function getFacilityInfo(facilityURN, region) {
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}`;
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching facility info:', error);
    return null;
  }
}

/**
 * Get facility thumbnail
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region (e.g., 'US', 'EMEA', 'AUS')
 * @returns {Promise<string>} Blob URL for thumbnail image
 */
export async function getFacilityThumbnail(facilityURN, region) {
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}/thumbnail`;
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.warn('Error fetching facility thumbnail:', error);
  }
  
  return null;
}

/**
 * Cleanup thumbnail blob URLs to prevent memory leaks
 */
const thumbnailURLs = new Set();

export function registerThumbnailURL(url) {
  if (url) {
    thumbnailURLs.add(url);
  }
}

export function cleanupThumbnailURLs() {
  thumbnailURLs.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Error revoking URL:', error);
    }
  });
  thumbnailURLs.clear();
}

/**
 * Get models for a facility
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region identifier
 * @returns {Promise<Array>} List of models
 */
export async function getModels(facilityURN, region) {
  try {
    const facilityInfo = await getFacilityInfo(facilityURN, region);
    return facilityInfo ? facilityInfo.links : null;
  } catch (error) {
    console.error('Error fetching models:', error);
    return null;
  }
}

/**
 * Get the default model URN from a facility URN
 * 
 * The "default" model is where streams and other logical elements exist.
 * It can be derived by replacing 'dtt' with 'dtm' in the facility URN.
 * 
 * @param {string} facilityURN - Facility URN
 * @returns {string} Default model URN
 */
export function getDefaultModelURN(facilityURN) {
  return facilityURN.replace('urn:adsk.dtt:', 'urn:adsk.dtm:');
}

/**
 * Helper function to log API responses in a developer-friendly format
 * 
 * This is used by STUB functions to show what's happening "under the hood"
 * for educational purposes.
 * 
 * @param {object} data - Response data to log
 * @param {string} label - Optional label for the log
 */
export function logResponse(data, label = 'Response') {
  console.log(`${label}:`, data);
  
  // For arrays, also show count
  if (Array.isArray(data)) {
    console.log(`📊 Count: ${data.length} items`);
  }
  
  // For objects with a length property
  if (data && typeof data === 'object' && 'length' in data) {
    console.log(`📊 Count: ${data.length} items`);
  }
}

