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
 * Scan for elements that have a specific qualified property
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 * @param {string} categoryName - Property category name
 * @param {string} propName - Property name
 * @param {boolean} includeHistory - Whether to include property history
 * @returns {Promise<void>}
 */
export async function scanForProperty(facilityURN, region, categoryName, propName, includeHistory) {
  console.group("STUB: scanForProperty()");
  
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
      
      // First, get the qualified property ID from the schema
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
        // Build qualified columns array
        const qualifiedColumns = qualProps.map(prop => prop.id);
        
        // Now scan for elements with this property
        const bodyPayload = JSON.stringify({
          qualifiedColumns: qualifiedColumns,
          includeHistory: includeHistory
        });
        
        const scanPath = `${tandemBaseURL}/modeldata/${modelURN}/scan`;
        console.log(scanPath);
        console.log(`Include History: ${includeHistory}`);
        
        const scanResponse = await fetch(scanPath, makeRequestOptionsPOST(bodyPayload, region));
        const scanData = await scanResponse.json();
        console.log("Result from Tandem DB Server -->", scanData);
        
        // Also show a nice table of the property values
        const propValues = [];
        for (let k = 1; k < scanData.length; k++) {
          const rowObj = scanData[k];
          if (rowObj) {
            const key = rowObj.k;
            for (let m = 0; m < qualProps.length; m++) {
              const prop = rowObj[qualProps[m].id];
              if (prop) {
                if (includeHistory) {
                  propValues.push({ key: key, prop: qualProps[m].id, value: prop });
                } else {
                  propValues.push({ key: key, prop: qualProps[m].id, value: prop[0] });
                }
              }
            }
          }
        }
        
        if (propValues.length > 0) {
          console.table(propValues);
        }
      } else {
        console.log(`Could not find [${categoryName} | ${propName}] in this model`);
      }
      
      console.groupEnd();
    }
  } catch (error) {
    console.error('Error scanning for property:', error);
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

/**
 * Find elements where a property value matches a specific pattern
 * 
 * @param {string} facilityURN - Facility URN
 * @param {string} region - Region header
 * @param {string} categoryName - Property category name
 * @param {string} propName - Property name
 * @param {string} matchStr - String or regex pattern to match
 * @param {boolean} isRegEx - Whether to treat matchStr as a regular expression
 * @param {boolean} isCaseInsensitive - Whether to do case-insensitive matching
 * @returns {Promise<void>}
 */
export async function findElementsWherePropValueEquals(facilityURN, region, categoryName, propName, matchStr, isRegEx, isCaseInsensitive) {
  console.group("STUB: findElementsWherePropValueEquals()");
  
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
      
      // First, get the qualified property ID from the schema
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
        // Build qualified columns array
        const qualifiedColumns = qualProps.map(prop => prop.id);
        
        // Scan for elements with this property
        const bodyPayload = JSON.stringify({
          qualifiedColumns: qualifiedColumns,
          includeHistory: false
        });
        
        const scanPath = `${tandemBaseURL}/modeldata/${modelURN}/scan`;
        console.log(scanPath);
        
        const scanResponse = await fetch(scanPath, makeRequestOptionsPOST(bodyPayload, region));
        const rawProps = await scanResponse.json();
        
        // Extract property values
        const propValues = [];
        for (let k = 1; k < rawProps.length; k++) {
          const rowObj = rawProps[k];
          if (rowObj) {
            const key = rowObj.k;
            for (let m = 0; m < qualProps.length; m++) {
              const prop = rowObj[qualProps[m].id];
              if (prop) {
                propValues.push({ 
                  modelURN: modelURN, 
                  key: key, 
                  prop: qualProps[m].id, 
                  value: prop[0] 
                });
              }
            }
          }
        }
        
        if (propValues.length > 0) {
          console.log("Raw properties returned-->", rawProps);
          console.log("Extracted properties-->", propValues);
          
          // Now filter based on match criteria
          let matchingProps = null;
          if (isRegEx) {
            try {
              let regEx = null;
              if (isCaseInsensitive) {
                regEx = new RegExp(matchStr, "i");
              } else {
                regEx = new RegExp(matchStr);
              }
              
              console.log("Doing RegularExpression match for:", regEx);
              matchingProps = propValues.filter(prop => regEx.test(prop.value));
            } catch (error) {
              console.error(`Invalid regular expression: "${matchStr}"`, error.message);
              console.log("TIP: Uncheck 'Is Javascript RegEx?' for literal string matching, or escape special characters in your regex pattern.");
              matchingProps = [];
            }
          } else {
            if (isCaseInsensitive) {
              console.log(`Doing case insensitive match for: "${matchStr}..."`);
              matchingProps = propValues.filter(prop => 
                String(prop.value).toLowerCase() === matchStr.toLowerCase()
              );
            } else {
              console.log(`Doing literal match for: "${matchStr}..."`);
              matchingProps = propValues.filter(prop => prop.value === matchStr);
            }
          }
          
          if (matchingProps.length > 0) {
            console.log("Matching property values-->");
            console.table(matchingProps);
          } else {
            console.log("No elements found with that value");
          }
        } else {
          console.log("Could not find any elements with that property: ", propName);
        }
      } else {
        console.log(`Could not find [${categoryName} | ${propName}] in this model`);
      }
      
      console.groupEnd();
    }
  } catch (error) {
    console.error('Error finding elements:', error);
  }
  
  console.groupEnd();
}

