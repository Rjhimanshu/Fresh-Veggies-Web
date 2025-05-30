# Fresh Veggies - Vegetable Supply Chain PWA

![Project Banner](https://via.placeholder.com/1200x400/3D9970/FFFFFF?text=Fresh+Veggies+Supply+Chain)  
*A Progressive Web App for vegetable wholesale-retail management*

## 🌟 Key Features

### Role-Based Access Control
- **Wholesaler Dashboard**: Inventory management, bulk pricing, order fulfillment
- **Retailer Portal**: Real-time catalog, order placement, payment tracking
- **Admin Console**: User management, analytics, system configuration

### Core Functionalities
- 🔄 Real-time order tracking with Firestore
- 🔐 Firebase Authentication (Email/Phone/Google)
- 💬 In-app messaging system
- 📲 PWA installation & offline capabilities
- 📊 Dynamic pricing engine

## 🧑‍💻 Tech Stack

| Category       | Technologies Used |
|---------------|-------------------|
| Frontend      | React 18, Vite, Tailwind CSS |
| Backend       | Node.js, Firebase Cloud Functions |
| Database      | Firestore (NoSQL), Firebase Storage |
| Auth          | Firebase Authentication |
| Hosting       | Firebase Hosting |
| CI/CD         | GitHub Actions |

## 📂 Project Structure
firebase.json # Firebase configuration
vite.config.js # Vite configuration
├── public/ # Static assets
├── src/
│ ├── assets/ # Images, fonts
│ ├── components/ # Reusable UI (Button, Card, etc.)
│ ├── features/ # Feature modules (auth, orders, chat)
│ ├── hooks/ # Custom hooks (useAuth, useFirestore)
│ ├── lib/ # Firebase initialization
│ ├── pages/ # Route components
│ ├── stores/ # Zustand stores
│ └── styles/ # Global styles
├── functions/ # Firebase Cloud Functions
└── .github/workflows # CI/CD pipelines


## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.x
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Installation
```bash
git clone https://github.com/Rjhimanshu/Fresh-Veggies-Web.git
cd Fresh-Veggies-Web
npm install
Configuration
Rename .env.example to .env.local

Add your Firebase config:

env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
Running Locally
bash
npm run dev  # Starts development server
Building for Production
bash
npm run build
firebase deploy
📸 Screenshots
Feature	Screenshot
Login Screen	Login
Order Dashboard	Dashboard
🤝 Contributing
Fork the repository

Create a new branch (git checkout -b feature/your-feature)

Commit changes (git commit -am 'Add some feature')

Push to branch (git push origin feature/your-feature)

Open a Pull Request

📜 License
Distributed under the MIT License. See LICENSE for more information.

📬 Contact
Himanshu Rajput
Email : rjhimanshu198@gmail.com
LinkedIn
