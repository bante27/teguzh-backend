# 🚍 Teguzh - Web-Based Cashless Bus Ticketing System Backend

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-%5E5.2.1-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-%5E9.7.3-green.svg)](https://www.mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Teguzh** is a hardware-free, web-based digital ticketing and transit management backend designed for public bus transit systems (such as Anbessa and Sheger buses). It replaces traditional paper tickets and physical POS terminals with a seamless **Static QR Code + Telebirr H5 Integration** workflow.

---

## 📱 UI & Payment Workflow Screenshots

> **⚠️ Important Notice for GitHub Display:**
> If the images show an error on GitHub, it means the `assets/` folder has not been pushed to your GitHub repository yet. Run the following terminal commands [`git add assets/`](package.json:6) to upload them:
> ```bash
> git add assets/
> git commit -m "Add UI screenshot assets"
> git push origin main
> ```

### 1. Telebirr H5 Checkout Screen
<p align="center">
  <img src="assets/image.png" alt="Telebirr H5 Checkout" width="350"/>
</p>

### 2. Payment Successful & Active Boarding Pass (View 1)
<p align="center">
  <img src="assets/image1.png" alt="Payment Successful 1" width="350"/>
</p>

### 3. Payment Successful & Active Boarding Pass (View 2)
<p align="center">
  <img src="assets/image2.png" alt="Payment Successful 2" width="350"/>
</p>

---

## 🌟 Key Features

* **Zero-Hardware Ticketing**: Passengers scan a static QR code inside the bus using their smartphone browser to open the web app instantly—no mobile app installation required.
* **Distance-Based Fare Calculation**: Dynamic fare estimation [`calculateFare()`](src/services/dynamicFare.js:1) based on the passenger's selected pick-up and drop-off stations.
* **Telebirr H5 Payment Integration**: Direct checkout via Telebirr API [`initiatePayment()`](src/services/telebirrService.js:1) with secure RSA signatures and webhook verification [`handleWebhook()`](src/controllers/passengerController.js:1).
* **Anti-Fraud Visual Ticket Verification**: Generates active boarding passes featuring live clock animations and hourly dynamic security colors [`generateQRCode()`](src/services/qrGenerator.js:1). Conductors verify tickets visually in seconds without physical scanners.
* **Role-Based Access Control (RBAC)**: Comprehensive middleware [`verifyToken()`](src/middleware/roleCheck.js:1) and role checks for Passengers, Conductors, and Admins.

---

## 🏗️ System Architecture & Workflow

```text
[ 📱 Passenger ] ───(1. Scan QR Code)───► [ 🌐 Web App Landing Screen ]
                                                      │
[ 💳 Telebirr API ] ◄───(3. H5 Checkout API)───────(2. Select Route & Fare)
         │
   (4. Webhook Callback)
         │
         ▼
[ 🟢 Active Ticket View ] ───(5. Visual Audit)───► [ 👮 Conductor ]
  (Live Clock & Token)
```

1. **Scan & Select**: Passenger scans the vehicle's [`Bus.js`](src/models/Bus.js:1) QR code and selects their destination station via [`passengerController.js`](src/controllers/passengerController.js:1).
2. **Pay**: The app triggers backend calculations [`dynamicFare.js`](src/services/dynamicFare.js:1) and initiates a Telebirr session via [`telebirrService.js`](src/services/telebirrService.js:1).
3. **Verify**: Upon successful webhook callback [`passengerRoutes.js`](src/routes/passengerRoutes.js:1), the database stores a verified [`Ticket.js`](src/models/Ticket.js:1) record.
4. **Board**: The conductor validates the active ticket status using [`conductorController.js`](src/controllers/conductorController.js:1).

---

## 📂 Project Directory Structure

```text
teguzh-backend/
├── assets/
│   ├── .gitkeep                  # Asset directory tracker
│   ├── image.png                 # Telebirr H5 Checkout screenshot
│   ├── image1.png                # Payment Successful screenshot 1
│   └── image2.png                # Payment Successful screenshot 2
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection configuration
│   │   └── telebirr.js           # Telebirr gateway configuration constants
│   ├── controllers/
│   │   ├── adminController.js     # Admin metrics & route tariff controls
│   │   ├── authController.js      # User authentication & registration logic
│   │   ├── conductorController.js # Ticket validation & audit endpoints
│   │   └── passengerController.js # Fare estimation, booking, and webhooks
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized Express error handler
│   │   ├── roleCheck.js          # Role-Based Access Control (RBAC) middleware
│   │   └── security.js           # Helmet security headers & rate limiting
│   ├── models/
│   │   ├── Admin.js              # Admin schema definition
│   │   ├── Bus.js                # Fleet vehicle metadata schema
│   │   ├── Conductor.js          # Conductor personnel profiles
│   │   ├── Route.js              # Station paths & tariff rate schema
│   │   └── Ticket.js             # Ticket transaction & status schema
│   ├── routes/
│   │   ├── adminRoutes.js        # Admin management router
│   │   ├── authRoutes.js         # Authentication router
│   │   ├── conductorRoutes.js    # Conductor verification router
│   │   └── passengerRoutes.js    # Passenger service router
│   └── services/
│       ├── dynamicFare.js        # Distance-based tariff calculation logic
│       ├── qrGenerator.js        # Static vehicle QR code generation utility
│       └── telebirrService.js    # RSA signing, AES encryption & Telebirr API client
├── .env                          # Environment variables configuration
├── package.json                  # Node.js dependencies and project metadata
├── server.js                     # Express application entry point
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (`v18.0.0` or higher recommended)
* **MongoDB** (Local instance or MongoDB Atlas cluster)

### 1. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/bante27/teguzh-backend.git
cd teguzh-backend
npm install
```

### 2. Environment Setup
Create a [` .env`](.env:1) file in the root directory [`package.json`](package.json:1) with the following environment variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/backend-teguzh
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Telebirr API Credentials
TELEBIRR_APP_ID=your_app_id
TELEBIRR_APP_KEY=your_app_key
TELEBIRR_SHORT_CODE=your_short_code
TELEBIRR_MERCHANT_ID=your_merchant_id
TELEBIRR_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### 3. Running the Server
Start the development server using [`nodemon`](package.json:8):

```bash
npm run dev
```

For production deployment via [`server.js`](server.js:1):

```bash
npm start
```

The server will start running at `http://localhost:5000`.

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description | Access Control |
| :--- | :--- | :--- | :--- |
| `POST` | [`/api/passenger/estimate-fare`](src/routes/passengerRoutes.js:1) | Calculates dynamic fare based on route stations | Public |
| `POST` | [`/api/passenger/book-ticket`](src/routes/passengerRoutes.js:1) | Initiates Telebirr H5 payment session | Public / Authenticated |
| `POST` | [`/api/passenger/telebirr-webhook`](src/routes/passengerRoutes.js:1) | Handles asynchronous payment callback from Telebirr | System / Webhook |
| `POST` | [`/api/conductor/verify-ticket`](src/routes/conductorRoutes.js:1) | Validates ticket status and records boardings | Conductor (`roleCheck.js`) |
| `POST` | [`/api/admin/routes`](src/routes/adminRoutes.js:1) | Manages base tariffs and station pricing | Admin (`roleCheck.js`) |

---

## 🛡️ Security Measures

* **RSA Encryption & Signatures**: Telebirr transactions are cryptographically signed and verified via [`telebirrService.js`](src/services/telebirrService.js:1).
* **Replay Attack Protection**: Active boarding passes incorporate dynamic time-based animations and unique tokens [`Ticket.js`](src/models/Ticket.js:1) to prevent screenshot reuse.
* **Rate Limiting & Security Headers**: Enforced via [`security.js`](src/middleware/security.js:1) utilizing [`helmet`](package.json:29) and custom rate limiters.
