import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return env;
  } catch (e) {
    console.error('⚠ .env file not found or not readable');
    return {};
  }
}

const envVars = loadEnv();
Object.keys(envVars).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = envVars[key];
  }
});

const BASE_URL = process.env.BASE_URL || 'https://solve.ivy.homes';
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY not found in .env file');
}

let authToken = null;
let tokenExpiry = null;

class APIClient {
  static async request(method, path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const query = options.query || {};

    const queryString = new URLSearchParams(query).toString();
    const fullURL = queryString ? `${url}?${queryString}` : url;

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
      method,
      headers,
      ...options.fetchOptions
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    console.log(`[${method}] ${path}${queryString ? '?' + queryString.substring(0, 50) : ''}`);

    const response = await fetch(fullURL, config);
    const data = await response.json();

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: data
    };
  }

  static async get(path, query = {}) {
    return this.request('GET', path, { query });
  }

  static async post(path, body = {}) {
    return this.request('POST', path, { body });
  }

  static async delete(path, query = {}) {
    return this.request('DELETE', path, { query });
  }

  static async health() {
    return this.get('/health');
  }

  static async login(email, password) {
    const result = await this.post('/auth/login', {
      email,
      password
    });

    if (result.status === 200 && result.body.access_token) {
      authToken = result.body.access_token;
      tokenExpiry = new Date(Date.now() + result.body.expires_in * 1000);
      console.log(`✓ Authenticated as ${email}, token expires at ${tokenExpiry.toISOString()}`);
    }

    return result;
  }

  static async logout() {
    const result = await this.post('/auth/logout');
    authToken = null;
    tokenExpiry = null;
    return result;
  }

  static async getListings(options = {}) {
    const query = {
      page: options.page || 1,
      limit: options.limit || 20,
      ...options.filters
    };
    return this.get('/v1/listings', query);
  }

  static async getListing(listingId) {
    return this.get(`/v1/listings/${listingId}`);
  }

  static async getRentals(options = {}) {
    const query = {
      page: options.page || 1,
      limit: options.limit || 20,
      ...options.filters
    };
    return this.get('/v1/rentals', query);
  }

  static async getProjects(options = {}) {
    const query = {
      page: options.page || 1,
      limit: options.limit || 20,
      ...options.filters
    };
    return this.get('/v1/projects', query);
  }

  static async getProject(projectId) {
    return this.get(`/v1/projects/${projectId}`);
  }

  static async getAnalyticsSummary() {
    return this.get('/v1/analytics/summary');
  }

  static async getAllRecords(endpoint, options = {}) {
    const records = [];
    let offset = 0;
    let hasMore = true;
    const limit = options.limit || 50;

    while (hasMore) {
      const result = await this.get(endpoint, {
        offset,
        limit,
        ...options.filters
      });

      if (result.status !== 200) {
        console.error(`✗ Failed to fetch ${endpoint} at offset ${offset}:`, result.body);
        break;
      }

      const batch = result.body.results;
      records.push(...batch);
      offset += batch.length;

      hasMore = result.body.has_more && batch.length > 0;

      console.log(`  [${endpoint}] +${batch.length} (${records.length}/${result.body.total})`);
    }

    return records;
  }

  static getToken() {
    return authToken;
  }

  static isAuthenticated() {
    return authToken !== null && tokenExpiry > new Date();
  }
}

export default APIClient;
