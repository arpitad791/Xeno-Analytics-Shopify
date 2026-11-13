
### Multi-Tenant Shopify Data Ingestion & Business Intelligence Platform


<div align="center">

<img src="./assets/cross.gif" alt="x" width="80"/> 

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=vercel)](https://xeno-savyagupta.vercel.app/login)


*Enterprise-grade analytics platform enabling retailers to seamlessly integrate, analyze, and visualize their Shopify store data in real-time.*

</div>

---
# Shopify Development Store Setup Guide

> **Note:** Shopify now creates dev stores and apps from the [Dev Dashboard](https://dev.shopify.com/dashboard), and new custom apps can no longer be created from the store admin. The steps below show the store setup; for connecting a store to this project (app, scopes, access token, webhooks) follow [Shopify Integration](#shopify-integration) under Getting Started.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** database

---

## Step 1: Create Shopify Partner Account

1. Navigate to [partners.shopify.com](https://partners.shopify.com)
2. Click **"Join Shopify Partners"**
3. Fill in your details and complete the registration process
4. Create your account
> **Note:** A Shopify Partner account gives you access to development stores and app development tools.

---

## Step 2: Create Development Store

1. In your Partners dashboard, navigate to **"Stores"**
2. Click **"Add store"** → **"Development store"**
3. Select **"Create a new development store"**
4. Fill in the required store details
5. Click **"Save"**

---

## Step 3: Configure Store Settings

When setting up your development store, configure the following:

- **Store name:** Choose a descriptive name (e.g., "Xeno Analytics Test Store")
- **Country/Region:** Select your primary location
- **Store purpose:** Select **"To test and develop apps"**

Once configured, click **"Create development store"**

---

## Step 4: Access Your Store

After creation, you can access your store in multiple ways:

1. **View Store:** Click on your store name in the Partners dashboard
2. **Store URL:** Note your store URL (format: `your-store.myshopify.com`)
3. **Frontend Access:** Click **"Open store"** to view the customer-facing storefront
4. **Admin Access:** Click **"Admin"** to access the Shopify admin dashboard

---

## Step 5: Navigate Shopify Admin Panel

The Shopify Admin panel is your main interface for managing:

- Products and inventory
- Orders and customers
- Store settings and apps
- Analytics and reports
- Theme customization

You can access the admin panel directly using:
```
https://your-store.myshopify.com/admin
```

---

## Next Steps

With your development store set up, you're ready to:

- Install and configure your app
- Test webhooks and API integrations
- Add sample products and customers
- Configure payment and shipping settings

---

## Additional Resources


- [Shopify Partner Documentation](https://shopify.dev/docs)
- [Shopify API Reference](https://shopify.dev/api)
- [Development Store Limitations](https://help.shopify.com/en/partners/dashboard/managing-stores/development-stores)

---

**Need Help?** Visit the [Shopify Community Forums](https://community.shopify.com) or contact Shopify Partner Support.
---

##  Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Live Deployment](#live-deployment)
- [Demo Access](#demo-access)
- [Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Design](#database-schema)
- [API Documentation](#api-endpoints)
- [Getting Started](#getting-started)

---

##  Overview

Xeno Analytics is a sophisticated multi-tenant platform designed to bridge the gap between Shopify's e-commerce capabilities and enterprise-level business intelligence. Built with modern web technologies and cloud-native architecture, it provides retailers with actionable insights through seamless data synchronization and advanced analytics.
### What It Solves

**Enterprise retailers struggle with:**
- Data fragmentation across systems
- Limited native Shopify analytics
- Multi-store management complexity
- Lack of real-time business visibility

**Xeno Analytics provides:**
- Real-time data synchronization via webhooks
- Multi-tenant architecture with complete data isolation
- Advanced analytics dashboard with customizable metrics
- Enterprise security with JWT authentication
- Scalable cloud-native infrastructure

  

---

##  Key Features

###  Authentication & Security
- JWT-based session management
- Multi-tenant data isolation
- bcrypt password encryption
- Role-based access control (including a read-only `VIEWER` role for demo logins)
- No credentials in source code: database URL, JWT secret and webhook secret come from environment variables

### Analytics Dashboard
- Real-time metrics (customers, orders, revenue)
- Interactive charts and visualizations
- Date range filtering
- Top customer analysis
- Inventory management insights
- Cart abandonment tracking

### Data Synchronization
- Manual sync of customers, products and orders from the Shopify Admin API
- Orders of every status (open, closed, archived, cancelled) are synced, with Shopify's original order date
- Real-time Shopify webhooks:
  - Every webhook is verified with Shopify's HMAC-SHA256 signature; unsigned or tampered requests are rejected
  - Each webhook is routed to the tenant that owns the sending store
  - The backend syncs the changed data into the database itself, so data stays current even when no dashboard is open
  - Bursts of webhooks are coalesced into a single follow-up sync per tenant and resource
  - Open dashboards refresh automatically within ~5 seconds, and only see their own store's events

### Multi-Tenant Architecture
- Streamlined tenant onboarding
- Complete data isolation per tenant
- Custom store configurations
- Unlimited scalability

---

## Live Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | [https://xeno-analytics-beige.vercel.app](https://xeno-analytics-beige.vercel.app/login) |
| **Backend** | Railway | [https://xeno-analytics-shopify-production.up.railway.app](https://xeno-analytics-shopify-production.up.railway.app/health) |
| **Database** | Railway | PostgreSQL |

---

## Demo Access

Try the live dashboard without setting up a Shopify store:

| | |
|---|---|
| **URL** | [https://xeno-analytics-beige.vercel.app/login](https://xeno-analytics-beige.vercel.app/login) |
| **Email** | `demo@xenoanalytics.com` |
| **Password** | `DemoPass123` |

The demo login is **read-only**: it sees a real Shopify development store's synced customers, products and orders, but cannot change the store connection or access token. Registering a new store requires your own Shopify store and Admin API access token (see [Getting Started](#getting-started)).

---

## System Architecture


```
┌──────────────────────────────────────────────────────┐
│                   CLIENT LAYER                       │
│  ┌────────────────────────────────────────────────┐  │
│  │         Next.js Frontend Application           │  │
│  │  • Authentication  • Dashboard  • Analytics    │ │
│  └────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS/REST
┌─────────────────────▼────────────────────────────────┐
│                APPLICATION LAYER                     │
│  ┌────────────────────────────────────────────────┐  │
│  │           Express.js API Gateway                 │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │   │
│  │  │   Auth   │ │ Analytics │ │   Shopify    │  │   │
│  │  │   API    │ │    API    │ │ Integration  │  │   │
│  │  └──────────┘ └───────────┘ └──────────────┘  │   │
│  └────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │ Prisma ORM
┌─────────────────────▼────────────────────────────────┐
│                   DATA LAYER                         │
│  ┌────────────────────────────────────────────────┐  │
│  │      PostgreSQL Database (Railway)             │  │
│  │  • Tenants  • Customers  • Orders  • Products  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Architecture Principles

- **Separation of Concerns**: Clean layer separation
- **Multi-Tenancy**: Shared database with tenant isolation
- **Security-First**: JWT validation on all protected routes
- **Scalability**: Cloud-native design supporting thousands of tenants

---

## Technology Stack

### Frontend
- **Next.jsUI framework
- **CSS3** - Responsive styling

### Backend
- **Node.js 18.x** - Runtime
- **Express.js 4.x** - Web framework
- **Prisma 5.x** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password security

### Infrastructure
- **PostgreSQL** - Database
- **Railway** - Database and backend hosting
- **Vercel** - Frontend hosting
- **Ngrok** - Webhook testing during local development


---

## Database Schema

```sql
-- Tenants Table (Multi-tenant isolation)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    tenantId VARCHAR(100) UNIQUE NOT NULL,
    shopDomain VARCHAR(255),
    accessToken TEXT,
    role VARCHAR(50) DEFAULT 'tenant',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenantId INTEGER NOT NULL REFERENCES tenants(id),
    shopifyCustomerId BIGINT,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    totalSpent DECIMAL(12,2) DEFAULT 0.00,
    ordersCount INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenantId, shopifyCustomerId)
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    tenantId INTEGER NOT NULL REFERENCES tenants(id),
    shopifyProductId BIGINT,
    title VARCHAR(500) NOT NULL,
    vendor VARCHAR(255),
    productType VARCHAR(255),
    price DECIMAL(12,2),
    inventory INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenantId, shopifyProductId)
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    tenantId INTEGER NOT NULL REFERENCES tenants(id),
    customerId INTEGER REFERENCES customers(id),
    shopifyOrderId BIGINT,
    orderNumber VARCHAR(100),
    totalPrice DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    financialStatus VARCHAR(50),
    orderStatus VARCHAR(50),
    createdAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenantId, shopifyOrderId)
);

-- Indexes for Performance
CREATE INDEX idx_customers_tenant ON customers(tenantId);
CREATE INDEX idx_orders_tenant ON orders(tenantId);
CREATE INDEX idx_products_tenant ON products(tenantId);
```

---

## API Endpoints

All endpoints except registration, login, health checks and the Shopify webhook receiver require a `Authorization: Bearer <JWT>` header.

### Authentication & Profile
```http
POST /api/auth/register-tenant     # Register a store + owner account
POST /api/auth/login-tenant        # Log in, returns a JWT (7-day expiry)
GET  /api/auth/validate-token      # Check a JWT
GET  /api/user/profile             # Current user and store
PUT  /api/user/profile             # Update store domain / access token (not allowed for VIEWER)
```

### Analytics
```http
GET /api/dashboard/:tenantId              # Totals: customers, products, orders, revenue
GET /api/analytics/orders-by-date         # ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (end date inclusive)
GET /api/analytics/top-customers          # Top 5 customers by spend
GET /api/analytics/cart-abandonment
GET /api/analytics/sales-performance
GET /api/analytics/customer-behavior
GET /api/analytics/product-performance
GET /api/customers/list                   # Paginated, searchable customer list
```

### Shopify Sync
```http
POST /api/sync/customers
POST /api/sync/products
POST /api/sync/orders               # All order statuses
POST /api/sync/all
```

### Shopify Webhooks
```http
POST /api/webhooks/shopify          # Called by Shopify; HMAC-verified, no JWT
GET  /api/webhooks/check?after=<n>  # Dashboard polls for its own store's new events
```

### Health
```http
GET /health
GET /test-db                        # Database connectivity + row counts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm/yarn
- Shopify Partner Account

### Installation

**1. Clone Repository**
```bash
git clone https://github.com/arpitad791/Xeno-Analytics-Shopify.git
cd Xeno-Analytics-Shopify
```

**2. Backend Setup**

Create `xeno-backend/.env`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/xeno"
JWT_SECRET="a-long-random-string"
SHOPIFY_WEBHOOK_SECRET="your-shopify-app-client-secret"   # needed for webhooks
PORT=3006
NODE_ENV=development
```

```bash
cd xeno-backend
npm install
npx prisma migrate deploy
npm run dev            # starts simple-server.js on PORT (default 3005)
```

**3. Frontend Setup**

Create `xeno-dashboard/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3006
```

```bash
cd xeno-dashboard
npm install
npm run dev            # http://localhost:3000
```

### Shopify Integration

Shopify no longer allows new custom apps to be created from the store admin ("Develop apps"); apps are created in the **Dev Dashboard**.

1. Go to [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard) and create a **dev store** from the **Dev stores** page. Note its `xxxx.myshopify.com` domain (shown in the admin URL).
2. Add sample products, customers and orders in the store admin (or generate test data when creating the store).
3. **Apps → Create app**, set Admin API scopes `read_products`, `read_customers`, `read_orders`, and **release** a version.
4. **Install** the app on the dev store. The app and store must be in the same Dev Dashboard organization.
5. Copy the app's **Client ID** and **Client secret** from its Settings page, then request an access token:
   ```bash
   curl -X POST "https://<store>.myshopify.com/admin/oauth/access_token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>"
   ```
   The returned `access_token` is valid for 24 hours.
6. Open the dashboard's **/register** page and enter the store domain and access token, then use **Sync All**.

**Webhooks (real-time updates)**

1. Set `SHOPIFY_WEBHOOK_SECRET` on the backend to the key Shopify signs webhooks with: the app's **Client secret** for app webhooks, or the signing key shown under **Settings → Notifications → Webhooks** for webhooks created in the store admin.
2. Create webhooks for `orders/create`, `orders/updated`, `products/create`, `products/update`, `customers/create` and `customers/update` (JSON format) pointing to:
   ```
   https://<backend-domain>/api/webhooks/shopify
   ```
3. For local testing, expose the backend with `ngrok http 3006` and use the ngrok URL instead.

### Deployment

**Database (Railway)**
1. Create a project on [railway.com](https://railway.com) and add **PostgreSQL**.
2. From your machine, create the tables using the database's `DATABASE_PUBLIC_URL`:
   ```bash
   cd xeno-backend
   DATABASE_URL="<DATABASE_PUBLIC_URL>" npx prisma migrate deploy
   ```

**Backend (Railway)**
1. In the same project: **Add → GitHub Repo** → this repository.
2. Service **Settings → Source → Root Directory**: `xeno-backend` (build and start are configured by `railway.json` / `nixpacks.toml`).
3. **Variables**: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET`, `NODE_ENV=production`, `SHOPIFY_WEBHOOK_SECRET`.
4. **Settings → Networking → Generate Domain**, then check `https://<domain>/health`.

**Frontend (Vercel)**
1. **Add New → Project** → import this repository and choose **only** the `xeno-dashboard` app (Root Directory `xeno-dashboard`, preset Next.js).
2. Add the environment variable `NEXT_PUBLIC_API_URL` = the Railway backend URL, **without a trailing slash**, as type **Config** (it is public and baked into the build).
3. Deploy. After changing `NEXT_PUBLIC_API_URL`, redeploy so the new value is built in.

The backend's CORS settings already allow `*.vercel.app` and `*.railway.app` origins.

**Demo login (optional)**

Create a read-only login that shares an existing owner's store:
```bash
cd xeno-backend
DATABASE_URL="<DATABASE_PUBLIC_URL>" node scripts/create-demo-user.js <ownerEmail> <demoEmail> <demoPassword>
```
Running it again for the same demo email resets its password. Demo (`VIEWER`) users can view and sync data but cannot change the store connection.

---

## Implementation Highlights

### Multi-Tenant Data Isolation
Every database query is automatically scoped to the authenticated tenant using middleware:

```javascript
// Automatic tenant context injection
app.use(tenantContextMiddleware);

// All queries filtered by tenant
const customers = await prisma.customer.findMany({
  where: { tenantId: req.tenant.id }
});
```

### Real-Time Webhook Processing
Shopify webhooks are verified, matched to the right tenant and synced into the database in the background (`xeno-backend/src/services/webhookService.js`):

```javascript
router.post("/shopify", async (req, res) => {
  // 1. Reject anything not signed by Shopify (HMAC-SHA256 over the raw body)
  if (!isValidHmac(req.body, req.get("x-shopify-hmac-sha256"), process.env.SHOPIFY_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }

  // 2. Find the tenant that owns the sending store
  const tenant = await findTenantByShopDomain(req.get("x-shopify-shop-domain"));

  // 3. Acknowledge quickly (Shopify retries slow or non-2xx responses)
  res.status(200).send("OK");

  // 4. Sync the affected resource for that tenant only; concurrent webhooks
  //    for the same tenant+resource collapse into one follow-up run
  scheduleSync(tenant.id, resourceFromTopic(req.get("x-shopify-topic")));
});
```

The dashboard polls `GET /api/webhooks/check` with its last-seen event number and refreshes only the charts affected by new events.

### Secure Authentication Flow
JWT-based authentication with HTTP-only cookies and token refresh:

```javascript
// Protected route middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.tenant = await getTenant(decoded.id);
  next();
};
```

---

## Future Roadmap

### Phase 1: Enhanced Analytics
- Customer segmentation
- Predictive analytics
- Custom report builder
- CSV/PDF exports

### Phase 2: Performance Optimization
- Redis caching layer
- Database query optimization
- CDN integration
- Rate limiting

### Phase 3: Enterprise Features
- Multi-user accounts
- Advanced RBAC
- Custom branding
- API rate limits per tenant
- GDPR compliance tools

### Phase 4: Scalability
- Database sharding
- Microservices architecture
- Message queue (RabbitMQ)
- Horizontal scaling

---

## Assumptions & Design Decisions

**Multi-Tenancy Model**
- Chose shared database with tenant_id isolation over separate databases
- Trade-off: Simpler deployment vs. absolute data separation
- Suitable for up to 10,000 tenants per instance

**Authentication**
- Implemented JWT instead of OAuth for development simplicity
- Production would use Shopify OAuth flow
- Session duration: 24 hours with refresh tokens

**Data Synchronization**
- Manual sync for the initial import (up to 250 records per resource per sync)
- HMAC-verified webhooks keep data current afterwards
- Webhook events are held in memory on the backend; a restart clears pending dashboard notifications, but the data itself is already in the database
- Shopify returns only the last 60 days of orders unless the app is granted `read_all_orders`
- Access tokens from the client-credentials grant expire after 24 hours; a new token can be saved from the dashboard's **Settings**

**Scalability**
- Current architecture supports 100 concurrent users
- Database indexed for common queries
- Ready for caching layer integration

---





*Thank you!*

</div>
