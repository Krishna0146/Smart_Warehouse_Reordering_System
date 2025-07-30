# 🏭 Smart Warehouse Reordering System
A comprehensive full-stack inventory management application that intelligently monitors stock levels and provides automated reordering recommendations for e-commerce businesses.
## 🚀 Features
Core Functionality

📊 Intelligent Stock Analysis: Calculate days of stock remaining based on current inventory and sales patterns
🔄 Automated Reorder Recommendations: Smart threshold-based reordering with safety stock calculations
💰 Cost Optimization: Optimal reorder quantity calculations for 60-day supply planning
📈 Demand Spike Simulation: Test how sudden demand increases affect inventory and reorder requirements
🎯 Priority Management: Criticality-based product categorization (High/Medium/Low)

## User Interface

📱 Responsive Design: Beautiful, modern UI built with React + Tailwind CSS
🎨 Interactive Dashboard: Real-time inventory overview with key metrics
📋 Product Management: Add, edit, and delete products with validation
📊 Detailed Analytics: Comprehensive reorder analysis with sorting and filtering
🔍 Smart Notifications: Real-time feedback system for all operations

## 🛠️ Technology Stack
### Backend

Node.js - Runtime environment
Express.js - Web framework
MongoDB - Database for data persistence
Mongoose - ODM for MongoDB
CORS - Cross-origin resource sharing

### Frontend

React 18 - UI library
Vite - Build tool and development server
Tailwind CSS - Utility-first CSS framework
Axios - HTTP client for API communication

### 📋 Prerequisites
Before running this application, make sure you have:

Node.js (v16.0.0 or higher)
npm or yarn package manager
MongoDB (local installation or MongoDB Atlas account)

### 🚀 Installation & Setup
1. Clone the Repository
git clone <repository-url>
cd smart_warehouse_reordering_system
2. Backend Setup
Navigate to backend directory
cd backend

### Install dependencies
npm install

### Create environment file
with .env in backend(must required)

### Edit .env file with your MongoDB connection string
### MONGODB_URI=mongodb://localhost:27017/warehouse_db
### PORT=5000
3. Frontend Setup
Navigate to frontend directory (in a new terminal)
cd frontend

### Install dependencies
npm install
4. Database Setup
Option A: Local MongoDB

Install MongoDB on your system
Start MongoDB service
The application will automatically create the database

Option B: MongoDB Atlas (Cloud)

Create a free account at MongoDB Atlas
Create a new cluster
Get your connection string
Update the MONGODB_URI in your .env file

🏃‍♂️ Running the Application
Start Backend Server -- 

cd backend
npm run dev
### Server will start on http://localhost:5000
Start Frontend Development Server
cd frontend
npm run dev
### Frontend will start on http://localhost:3000
Load Sample Data

Open the application in your browser
Click the "🌱 Load Sample Data" button in the header
This will populate the database with sample products

📚 API Documentation
Base URL
http://localhost:5000/api
Endpoints
Products

GET /products - Get all products
POST /products - Create a new product
PUT /products/:id - Update a product
DELETE /products/:id - Delete a product

Analysis

GET /reorder-analysis - Get reorder analysis for all products
POST /simulate-demand-spike - Simulate demand spike impact

### Utilities

POST /seed-data - Populate database with sample data

Sample API Request
javascript// Create a new product
POST /api/products
{
  "productId": "PROD-001",
  "name": "Wireless Bluetooth Headphones",
  "currentStock": 45,
  "averageDailySales": 3.2,
  "supplierLeadTime": 7,
  "minimumReorderQuantity": 50,
  "costPerUnit": 29.99,
  "criticality": "high"
}
### 🧮 Business Logic
Key Calculations
Days of Stock Remaining
Days Remaining = Current Stock ÷ Average Daily Sales
Safety Stock Threshold
Safety Threshold = Supplier Lead Time + Buffer Days (default: 5)
Reorder Trigger
Needs Reorder = Days Remaining ≤ Safety Threshold
Optimal Reorder Quantity
Target Stock = Average Daily Sales × Target Days (default: 60)
Reorder Quantity = max(Target Stock - Current Stock, Minimum Reorder Quantity)
Demand Spike Simulation

Calculate spike consumption: Spiked Daily Sales × Spike Duration
Update remaining stock: Current Stock - Spike Consumption
Recalculate averages: Weighted average including spike period
Determine new requirements: Based on updated metrics

### 🎨 Features Overview
Dashboard

📊 Key Metrics: Total products, low stock alerts, inventory value, critical items
🚨 Urgent Reorders: Quick view of products needing immediate attention
🔥 High Priority Items: Focus on critical inventory

Product Management

📦 Product Grid: Visual product cards with stock levels and metrics
✏️ Inline Editing: Edit product details directly in the interface
🗑️ Easy Deletion: Remove products with confirmation dialogs

Reorder Analysis

📋 Detailed Table: Comprehensive view of all products with reorder status
🔍 Sorting & Filtering: Sort by urgency, cost, or criticality
💰 Cost Calculations: Estimated reorder costs and investment requirements

Demand Simulation

⚡ Spike Testing: Simulate 2x, 3x, or custom demand multipliers
📈 Impact Analysis: See how spikes affect stock levels and reorder needs
💡 Recommendations: Get actionable insights for inventory planning

🔧 Configuration
Environment Variables
bash# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/warehouse_db
PORT=5000

### For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warehouse_db
Customization Options

Safety Buffer Days: Modify the 5-day default buffer in calculations
Target Supply Days: Change the 60-day default supply target
Criticality Levels: Extend beyond High/Medium/Low if needed

## 🏗️ Architecture
Backend Structure
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
└── README.md         # Documentation
Frontend Structure
frontend/
├── src/
│   ├── components/    # React components
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # React app entry point
│   └── index.css     # Global styles
├── index.html        # HTML template
├── package.json      # Dependencies and scripts
├── vite.config.js    # Vite configuration

### 🎯 Key Business Benefits
🚀 Reduced Stockouts: Proactive reordering prevents inventory shortages
💰 Cost Optimization: Right-sized orders minimize holding costs
⏰ Time Savings: Automated analysis reduces manual inventory management
📊 Data-Driven Decisions: Historical patterns inform future planning
🎯 Priority Focus: Criticality levels help prioritize attention and resources

## output screens :
<img width="1899" height="919" alt="Screenshot 2025-07-30 172639" src="https://github.com/user-attachments/assets/384584f8-c540-49ba-b584-4281d287ab66" />
<img width="1889" height="916" alt="Screenshot 2025-07-30 172654" src="https://github.com/user-attachments/assets/50ac4a53-8ec2-4348-b65e-3a20fd3535f8" />
<img width="1878" height="913" alt="Screenshot 2025-07-30 172713" src="https://github.com/user-attachments/assets/f9e1c23b-24d9-44ab-a674-b94383144710" />
<img width="1879" height="916" alt="Screenshot 2025-07-30 172724" src="https://github.com/user-attachments/assets/f43578cc-4f34-4745-8b50-3e3d790daea5" />
<img width="1878" height="920" alt="Screenshot 2025-07-30 172739" src="https://github.com/user-attachments/assets/4a1165be-1fbc-4c79-9a4d-3a83aa388607" />
<img width="1873" height="921" alt="Screenshot 2025-07-30 172749" src="https://github.com/user-attachments/assets/741668d3-d33b-4f1e-99dc-69d9507c5e0f" />
<img width="1884" height="914" alt="Screenshot 2025-07-30 172758" src="https://github.com/user-attachments/assets/33a7dfe2-69e7-4030-9e63-773aa4c653a3" />

