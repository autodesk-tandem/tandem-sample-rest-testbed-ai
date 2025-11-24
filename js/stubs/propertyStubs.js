import { tandemBaseURL, makeRequestOptionsGET, makeRequestOptionsPOST } from '../api.js';

/**
 * Get the schema for a specific model, then search for a qualified property by category and name
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 * @param {string} categoryName - Property category name
 * @param {string} propName - Property name
 * @returns {Promise<void>}
 */
export async function getQualifiedProperty(facilityURN, region, categoryName, propName) {
  console.group("STUB: getQualifiedProperty()");
  
  // Get list of models for this facility
  const facilityPath = `${tandemBaseURL}/twins/${facilityURN}`;
  console.log(facilityPath);
  
  try {
    const facilityResponse = await fetch(facilityPath, makeRequestOptionsGET(region));
    const facilityData = await facilityResponse.json();
    const models = facilityData.links || [];
    
    // Loop through each model
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const modelLabel = model.label || `Model ${i}`;
      const modelURN = model.modelId;
      
      console.group(`Model[${i}] --> ${modelLabel}`);
      console.log(`Model URN: ${modelURN}`);
      
      // Get schema for this model
      const schemaPath = `${tandemBaseURL}/modeldata/${modelURN}/schema`;
      console.log(schemaPath);
      
      const schemaResponse = await fetch(schemaPath, makeRequestOptionsGET(region));
      const schema = await schemaResponse.json();
      
      // Search for the qualified property
      const qualProps = [];
      const attrs = schema.attributes || [];
      
      for (let j = 0; j < attrs.length; j++) {
        if (attrs[j].category === categoryName && attrs[j].name === propName) {
          qualProps.push(attrs[j]);
        }
      }
      
      if (qualProps.length > 0) {
        if (qualProps.length === 1) {
          console.log(`Qualified Property for [${categoryName} | ${propName}]:`, qualProps[0]);
        } else {
          console.warn("WARNING: Multiple qualified properties found for this name...");
          qualProps.forEach((prop, idx) => {
            console.log(`Qualified Property [${idx}] for [${categoryName} | ${propName}]:`, prop);
          });
        }
      } else {
        console.log(`Could not find [${categoryName} | ${propName}]`);
      }
      
      console.groupEnd();
    }
  } catch (error) {
    console.error('Error fetching qualified property:', error);
  }
  
  console.groupEnd();
}

/**
 * Scan for all user-defined properties (DtProperties family = "z")
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 * @returns {Promise<void>}
 */
export async function scanForUserProps(facilityURN, region) {
  console.group("STUB: scanForUserProps()");
  
  try {
    // Get list of models for this facility
    const facilityPath = `${tandemBaseURL}/twins/${facilityURN}`;
    console.log(facilityPath);
    
    const facilityResponse = await fetch(facilityPath, makeRequestOptionsGET(region));
    const facilityData = await facilityResponse.json();
    const models = facilityData.links || [];
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const modelLabel = model.label || `Model ${i}`;
      const modelURN = model.modelId;
      
      console.group(`Model[${i}] --> ${modelLabel}`);
      console.log(`Model URN: ${modelURN}`);
      
      const bodyPayload = JSON.stringify({
        families: ["z"], // DtProperties family
        includeHistory: false
      });
      
      const requestPath = `${tandemBaseURL}/modeldata/${modelURN}/scan`;
      console.log(requestPath);
      
      const response = await fetch(requestPath, makeRequestOptionsPOST(bodyPayload, region));
      const obj = await response.json();
      console.log("Result from Tandem DB Server -->", obj);
      
      console.groupEnd();
    }
  } catch (error) {
    console.error('Error scanning for user props:', error);
  }
  
  console.groupEnd();
}

