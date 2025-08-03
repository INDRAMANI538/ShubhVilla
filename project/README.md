# SHUBH VILLA SOCIETY Management System

A comprehensive society management system built with React, TypeScript, and Firebase.

## Features

- **Dual Authentication**: Admin and Member login with role-based access
- **Maintenance Management**: Track payments, generate bills, and manage dues
- **Owner Details**: Complete owner profiles with contact information
- **Tenant Details**: Tenant management with lease tracking
- **Verification System**: Document verification with approval workflows
- **Dashboard**: Real-time statistics and activity monitoring
- **Responsive Design**: Works seamlessly on all devices

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication with Email/Password
4. Create a Firestore database
5. Copy your Firebase configuration
6. Replace the configuration in `src/config/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can read all user documents
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Other collections can be added as needed
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Firebase configuration (see above)

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Register a new account or use existing credentials

## User Roles

- **Admin**: Full access to all features including owner management, payments, and reports
- **Member**: Limited access to maintenance, tenant details, and verification features

## Technology Stack

- React 18 with TypeScript
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard components
│   ├── Layout/         # Layout components
│   ├── Maintenance/    # Maintenance management
│   ├── Owners/         # Owner management
│   ├── Tenants/        # Tenant management
│   └── Verification/   # Verification system
├── config/             # Configuration files
├── context/            # React context providers
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```