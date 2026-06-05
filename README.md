# SF Validation Manager

A full-stack React + Node.js application to manage Salesforce Account validation rules via OAuth 2.0 PKCE + Tooling API.

---

## Features

- 🔐 **OAuth 2.0 PKCE** – Secure Salesforce login without exposing client secrets
- 📋 **Fetch Validation Rules** – Retrieve all Account validation rules via Tooling API
- 🔄 **Toggle Rules** – Activate/deactivate individual rules instantly
- ⚡ **Bulk Enable/Disable** – Enable or disable all rules at once
- 🚀 **Deploy Changes** – Confirm and deploy changes back to Salesforce
- 🎨 **Modern UI** – Dark-themed, responsive React dashboard

---

## Prerequisites

- Node.js 18+
- A Salesforce Developer Org ([signup](https://developer.salesforce.com/signup))
- A Connected App in Salesforce with:
  - OAuth enabled
  - Callback URL: `http://localhost:3000/auth/callback`
  - Scopes: `api`, `refresh_token`

---

## Setup

### 1. Configure the Connected App in Salesforce

1. Go to **Setup → App Manager → New Connected App**
2. Fill in:
   - Connected App Name: `SF Validation Manager`
   - Callback URL: `http://localhost:3000/auth/callback`
   - Scopes: `Access and manage your data (api)`, `Perform requests at any time (refresh_token)`
3. Enable **PKCE** (uncheck "Require Secret for Web Server Flow")
4. Save and copy the **Consumer Key** and **Consumer Secret**

### 2. Create Validation Rules on Account Object

In Setup → Object Manager → Account → Validation Rules, create 4–5 rules such as:

- `Account_Name_Required` – Validates Name is not blank
- `Phone_Format_Check` – Validates Phone format
- `Annual_Revenue_Positive` – Revenue must be > 0
- `BillingCity_Required` – BillingCity cannot be blank
- `Industry_Required` – Industry must be set

### 3. Install & Run

```bash
# Clone or unzip the project
cd sf-validation-manager

# Install all dependencies
npm run install:all

# Start backend (port 5000)
npm run start:backend

# In a new terminal, start frontend (port 3000)
npm run start:frontend
```

### 4. Environment Variables

Edit `backend/.env`:
```
SF_CLIENT_ID=<your_consumer_key>
SF_CLIENT_SECRET=<your_consumer_secret>
SF_REDIRECT_URI=http://localhost:3000/auth/callback
SF_LOGIN_URL=https://login.salesforce.com
PORT=5000
SESSION_SECRET=your-random-secret
```

---

## Usage

1. Open `http://localhost:3000`
2. Click **"Connect to Salesforce"** → logs in via PKCE OAuth
3. Click **"Fetch Rules"** → loads all Account validation rules
4. **Toggle** individual rules with the switch
5. **Enable All / Disable All** for bulk operations
6. Click **"Deploy"** to confirm changes in Salesforce

---

## Project Structure

```
sf-validation-manager/
├── backend/
│   ├── server.js          # Express server with OAuth + Tooling API routes
│   ├── .env               # Environment variables
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx         # Root component with routing
        ├── hooks/
        │   └── useAuth.js  # Auth context (login, logout, callback)
        ├── pages/
        │   ├── LoginPage.jsx    # Landing page with login button
        │   ├── CallbackPage.jsx # OAuth callback handler
        │   └── Dashboard.jsx    # Main dashboard
        ├── components/
        │   └── RuleCard.jsx     # Individual rule card with toggle
        ├── utils/
        │   └── api.js           # Axios API helpers
        └── styles/
            └── globals.css      # CSS variables & animations
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/url` | Get Salesforce OAuth URL with PKCE params |
| POST | `/api/auth/token` | Exchange code for access token |
| GET | `/api/auth/me` | Get current session info |
| POST | `/api/auth/logout` | Revoke token and clear session |
| GET | `/api/validation-rules` | Fetch all Account validation rules |
| PATCH | `/api/validation-rules/:id` | Toggle single rule |
| PATCH | `/api/validation-rules` | Bulk toggle rules |
| POST | `/api/validation-rules/deploy` | Deploy pending changes |

---

## OAuth 2.0 PKCE Flow

```
Frontend         Backend              Salesforce
   |                 |                    |
   |-- GET /auth/url ->                   |
   |<-- authUrl + state --                |
   |                 |                    |
   |-- redirect to Salesforce ----------->|
   |<-- callback with ?code=... ----------|
   |                 |                    |
   |-- POST /auth/token (code + verifier)->|
   |                 |-- POST /oauth2/token|
   |                 |<-- access_token ----|
   |<-- success -----|                    |
```

The PKCE flow generates a `code_verifier` (random secret) and `code_challenge` (SHA-256 hash). This eliminates the need to send the client secret in the browser.

---

## Tech Stack

- **Frontend**: React 18, Axios
- **Backend**: Node.js, Express, express-session
- **Auth**: OAuth 2.0 PKCE (RFC 7636)
- **Salesforce APIs**: Tooling API v59.0
- **Styling**: Pure CSS with CSS variables
