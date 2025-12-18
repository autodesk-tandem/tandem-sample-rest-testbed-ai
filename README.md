# Tandem REST API Testbed (AI Edition)

A developer-focused web application for learning and exploring the Autodesk Tandem REST API. This project provides **STUB functions** that demonstrate how to make API calls, with detailed console logging to help you understand the request/response cycle.

## 🎯 Purpose

This testbed is designed for **developer education**. Unlike typical end-user applications that hide API complexity, this project intentionally exposes it:

- ✅ Learn how to construct Tandem API URLs
- ✅ Understand what headers are required
- ✅ See actual request/response data
- ✅ Explore Tandem data structures interactively
- ✅ Copy patterns into your own applications

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome recommended for DevTools)
- An Autodesk account with access to at least one Tandem facility
- A local web server (Python, Node.js http-server, etc.)

### Running Locally

1. **Clone or download this repository**

2. **Start a local web server** in the project root:

   ```bash
   # Python 3
   python -m http.server 8000
   
   # OR Node.js
   npx http-server -p 8000
   ```

3. **Open your browser** to `http://localhost:8000`

4. **Sign in** with your Autodesk account

5. **Open Chrome DevTools** (F12 or Cmd+Option+I)

6. **Select a facility** from the dropdowns

7. **Click any API button** and watch the console!

## 📖 How to Use

### 1. Open the Console

The most important step! All STUB functions output to the browser console:

- **Chrome/Edge**: Press F12 or Cmd+Option+I (Mac)
- **Firefox**: Press F12 or Cmd+Option+K (Mac)

### 2. Click a STUB Button

Each button executes one Tandem API call. For example, "GET Facility Info" calls:

```
GET /twins/{facilityURN}
```

### 3. Inspect the Console Output

You'll see detailed logging including:

```javascript
🔍 STUB: getFacilityInfo()
📋 Purpose: Get complete facility information
🌐 Request URL: https://developer.api.autodesk.com/tandem/v1/twins/urn:adsk.dtt:...
🗺️  Region: US
⚙️  Method: GET
🔑 Auth: Bearer token (from session storage)
📤 Sending request...
📥 Response status: 200 OK
✅ Success! API returned facility info:
📦 Facility Data: {...}
```

### 4. Expand Objects in Console

Click the triangles (▶) next to objects to drill down and explore the data structure.

## 🏗️ Architecture

This project uses a clean separation of concerns:

```
tandem-sample-rest-testbed-ai/
├── index.html              # UI with Tailwind CSS
├── js/
│   ├── app.js             # Orchestrates login & facility selection
│   ├── auth.js            # OAuth authentication flow
│   ├── api.js             # Core API utilities
│   ├── config.js          # Environment configuration
│   ├── stubs/             # STUB functions (API calls)
│   │   └── facilityStubs.js
│   └── ui/                # UI rendering (separate from logic)
│       └── stubUI.js
└── tandem/
    ├── constants.js       # Tandem constants (QC, ColumnFamilies, etc.)
    └── keys.js            # Key utilities (short/long keys, xrefs)
```

### Key Design Principles

1. **STUB files are pure API logic** - No UI concerns, just fetch calls and console logging
2. **UI files handle rendering** - Buttons, forms, event handlers
3. **Clean separation** - Easy to copy STUB functions into your own projects

## 📚 Adding New STUB Functions

Want to add more API endpoints? Follow this pattern:

### Step 1: Add STUB Function

Edit `js/stubs/facilityStubs.js` (or create a new stub file):

```javascript
export async function getModels(facilityURN, region) {
  console.group("🔍 STUB: getModels()");
  console.log("📋 Purpose: Get all models in the facility");
  
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}`;
  console.log("🌐 Request URL:", requestPath);
  
  try {
    const response = await fetch(requestPath, makeRequestOptionsGET(region));
    const data = await response.json();
    
    console.log("✅ Success!");
    logResponse(data.links, "📦 Models");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  console.groupEnd();
}
```

### Step 2: Add UI Button

Edit `js/ui/stubUI.js` in the `renderStubs()` function:

```javascript
section.appendChild(createStubButton(
  'GET Models',
  'Get list of models in this facility',
  () => facilityStubs.getModels(currentFacilityURN, currentFacilityRegion)
));
```

That's it! Refresh the page and your new button appears.

## 🔧 Adding STUBs with Input Parameters

Some API calls need parameters (like a User ID). Use `createStubWithInput()`:

```javascript
// In facilityStubs.js
export async function getUserAccessLevel(facilityURN, region, userId) {
  console.group("🔍 STUB: getUserAccessLevel()");
  
  const requestPath = `${tandemBaseURL}/twins/${facilityURN}/users/${userId}`;
  // ... rest of implementation
}

// In stubUI.js
const stub = createStubWithInput(
  'GET User Access Level',
  'Get access level for a specific user',
  [{ label: 'User ID', placeholder: 'Enter user ID...', id: 'userId' }],
  (inputs) => {
    return facilityStubs.getUserAccessLevel(
      currentFacilityURN, 
      currentFacilityRegion, 
      inputs.userId
    );
  }
);
section.appendChild(stub);
```

## 🔑 Understanding Tandem Concepts

### Facilities vs Models

- **Facility (Twin)**: The building/asset (e.g., "Empire State Building")
  - URN format: `urn:adsk.dtt:...`
  - Contains metadata, users, templates
  
- **Model**: A 3D model within a facility (can be multiple)
  - URN format: `urn:adsk.dtm:...`
  - Contains geometry and properties
  - The "default model" is where streams and logical elements exist

### Regions

Tandem data is stored in regional servers:
- `US` - United States
- `EMEA` - Europe, Middle East, Africa
- `AUS` - Australia

The `Region` header tells the API which server to query.

### Keys

Element keys come in two sizes:
- **Short Key** (20 bytes): Used for querying
- **Long Key** (24 bytes): Returned by API, includes flags

Use the utilities in `tandem/keys.js` to convert between them.

### Properties

Properties are organized into families:
- `n` (Standard): Built-in properties (name, category, etc.)
- `l` (Refs): References within same model
- `x` (Xrefs): Cross-model references
- `s` (Source): Properties from source file
- `z` (DtProperties): User-defined properties

See `tandem/constants.js` for the complete list.

## 🛠️ Troubleshooting

### "No facilities found"

Make sure:
1. You're signed in with the correct Autodesk account
2. You have access to at least one Tandem facility
3. Try accessing https://tandem.autodesk.com to verify

### "401 Unauthorized"

Your token expired. Click "Sign Out" and sign in again.

### Console shows errors

1. Check the Network tab in DevTools
2. Look for red requests (failed)
3. Click on them to see the error response
4. Common issues:
   - Wrong region (try different region)
   - Missing permissions
   - Invalid URN

### Button clicks do nothing

Make sure Chrome DevTools console is open - that's where all output goes!

## 📚 Additional Resources

- [Tandem API Documentation](https://aps.autodesk.com/en/docs/tandem/v1/developers_guide/overview/)
- [Tandem Developer Forum](https://forums.autodesk.com/t5/tandem-api/bd-p/tandem-api)
- [APS Developer Portal](https://aps.autodesk.com/)

## 🔐 Authentication Note

This app uses **PKCE** (Proof Key for Code Exchange) for OAuth authentication, which is safe for public clients. The client ID is intentionally included in the source code - this is the recommended approach for browser-based apps. See [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) for details.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

This is a learning tool! Feel free to:
- Add more STUB functions
- Improve documentation
- Share with other developers
- Report issues

## 🎓 Next Steps

Once you're comfortable with the STUB functions here:

1. **Explore the Network tab** - See the actual HTTP requests
2. **Copy patterns** - Use STUB code as templates for your apps
3. **Read API docs** - Links are in the console output
4. **Build something** - Apply what you learned!

---

**Made with ❤️ for Tandem API developers**


