require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'sf-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.get('/api/auth/url', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SF_CLIENT_ID,
    redirect_uri: process.env.SF_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    scope: 'api refresh_token'
  });
  res.json({ authUrl: `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params}`, state });
});

app.post('/api/auth/token', async (req, res) => {
  const { code, state } = req.body;
  if (state !== req.session.state) return res.status(400).json({ error: 'State mismatch' });
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code', code,
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      redirect_uri: process.env.SF_REDIRECT_URI,
      code_verifier: req.session.codeVerifier
    });
    const response = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`, params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    req.session.accessToken = response.data.access_token;
    req.session.instanceUrl = response.data.instance_url;
    try {
      const userRes = await axios.get(response.data.id, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      req.session.userInfo = {
        username: userRes.data.username, displayName: userRes.data.display_name,
        email: userRes.data.email, orgId: userRes.data.organization_id
      };
    } catch (e) { req.session.userInfo = {}; }
    res.json({ success: true, instanceUrl: response.data.instance_url, userInfo: req.session.userInfo });
  } catch (error) {
    res.status(400).json({ error: error.response?.data?.error_description || 'Token exchange failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.accessToken) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, instanceUrl: req.session.instanceUrl, userInfo: req.session.userInfo });
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    await axios.post(
      `${req.session.instanceUrl}/services/oauth2/revoke`,
      new URLSearchParams({ token: req.session.accessToken }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
  } catch (e) {}
  req.session.destroy();
  res.json({ success: true });
});

function requireAuth(req, res, next) {
  if (!req.session.accessToken) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// ─── Helper: fetch full rule (including formula) then update Active ──────────
async function toggleRuleById(session, id, active) {
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json'
  };
  const base = `${session.instanceUrl}/services/data/v59.0/tooling`;

  // Step 1: fetch full rule — formula is inside Metadata object
  const fetchRes = await axios.get(`${base}/sobjects/ValidationRule/${id}`, { headers });
  const meta = fetchRes.data.Metadata || {};
  console.log('Metadata:', JSON.stringify(meta));

  // Step 2: PATCH using Metadata wrapper with formula from meta
  await axios.patch(
    `${base}/sobjects/ValidationRule/${id}`,
    {
      Metadata: {
        active: active,
        errorConditionFormula: meta.errorConditionFormula,
        errorMessage: meta.errorMessage,
        description: meta.description || '',
        errorDisplayField: meta.errorDisplayField || null
      }
    },
    { headers }
  );
}

// ─── Validation Rules Routes ─────────────────────────────────────────────────

// GET all rules
app.get('/api/validation-rules', requireAuth, async (req, res) => {
  try {
    const query = encodeURIComponent(
      `SELECT Id, ValidationName, Active, Description, ErrorMessage, ErrorDisplayField FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'`
    );
    const response = await axios.get(
      `${req.session.instanceUrl}/services/data/v59.0/tooling/query?q=${query}`,
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    const rules = response.data.records.map(r => ({
      id: r.Id, name: r.ValidationName, active: r.Active,
      description: r.Description || '', errorMessage: r.ErrorMessage || '',
      errorDisplayField: r.ErrorDisplayField || ''
    }));
    res.json({ rules, total: rules.length });
  } catch (error) {
    console.error('Fetch rules error:', error.response?.data);
    res.status(500).json({ error: 'Failed to fetch rules', details: error.response?.data });
  }
});

// PATCH single rule toggle
app.patch('/api/validation-rules/toggle/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  console.log(`Toggle single: id=${id} active=${active}`);
  try {
    await toggleRuleById(req.session, id, active);
    console.log(`Toggle success: id=${id} active=${active}`);
    res.json({ success: true, id, active });
  } catch (error) {
    console.error('Single toggle error:', JSON.stringify(error.response?.data));
    res.status(500).json({ error: 'Failed to update rule', details: error.response?.data });
  }
});

// PATCH bulk rules
app.patch('/api/validation-rules', requireAuth, async (req, res) => {
  const { rules } = req.body;
  const results = [], errors = [];
  for (const rule of rules) {
    try {
      await toggleRuleById(req.session, rule.id, rule.active);
      results.push({ id: rule.id, success: true });
    } catch (error) {
      console.error('Bulk toggle error for', rule.id, error.response?.data);
      errors.push({ id: rule.id, error: error.response?.data });
    }
  }
  res.json({ results, errors, success: errors.length === 0 });
});

// POST deploy
app.post('/api/validation-rules/deploy', requireAuth, async (req, res) => {
  const { changes } = req.body;
  const results = [], errors = [];
  for (const change of changes) {
    try {
      await toggleRuleById(req.session, change.id, change.active);
      results.push({ id: change.id, success: true });
    } catch (error) {
      errors.push({ id: change.id, error: error.response?.data });
    }
  }
  try {
    const query = encodeURIComponent(
      `SELECT Id, ValidationName, Active, Description, ErrorMessage, ErrorDisplayField FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'`
    );
    const response = await axios.get(
      `${req.session.instanceUrl}/services/data/v59.0/tooling/query?q=${query}`,
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    const rules = response.data.records.map(r => ({
      id: r.Id, name: r.ValidationName, active: r.Active,
      description: r.Description || '', errorMessage: r.ErrorMessage || '',
      errorDisplayField: r.ErrorDisplayField || ''
    }));
    res.json({ success: errors.length === 0, results, errors, rules });
  } catch (e) {
    res.json({ success: errors.length === 0, results, errors });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}\n`);
});