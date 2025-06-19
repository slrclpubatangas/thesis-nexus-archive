# UndergradFile - Undergraduate Research Collection System

## Overview

UndergradFile is a full-stack web application designed for managing undergraduate thesis submissions and research collections. The system provides a public submission interface for students and an administrative dashboard for managing thesis data, user records, and system statistics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: React Router for client-side navigation

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Supabase Auth integration
- **Session Management**: PostgreSQL-based session storage

### Development Setup
- **Monorepo Structure**: Client and server code in same repository
- **Development Server**: Vite dev server with Express API proxy
- **Hot Module Replacement**: Enabled for React components
- **TypeScript**: Strict configuration with path aliases

## Key Components

### 1. Authentication System
- **Provider**: Supabase Authentication
- **Session Management**: JWT tokens with refresh token rotation
- **User Roles**: Admin and Reader roles stored in system_users table
- **Access Control**: Role-based component rendering and API access

### 2. Thesis Submission System
- **Public Interface**: Form for LPU and non-LPU students
- **Data Validation**: Client-side and server-side validation
- **Search Integration**: Real-time thesis title search with suggestions
- **File Upload**: Support for thesis document uploads

### 3. Administrative Dashboard
- **Statistics Tab**: Charts and metrics for submission analytics
- **User Records**: Management of student submissions
- **Thesis Data**: Bulk CSV upload and thesis record management
- **System Users**: Admin user management with role assignment

### 4. Database Schema
- **thesis_data**: Core thesis records with full-text search
- **system_users**: Administrative user accounts
- **users**: Basic user authentication (Drizzle schema)
- **Row Level Security**: Enabled on thesis_data table

## Data Flow

### Submission Flow
1. Student accesses public submission form
2. Form validates input and checks for duplicate thesis titles
3. Data submitted to Express API endpoints
4. Server validates and stores in PostgreSQL database
5. Success confirmation sent to user

### Authentication Flow
1. User attempts login through modal interface
2. Supabase Auth validates credentials
3. JWT token stored in browser
4. User role fetched from system_users table
5. Dashboard access granted based on role

### Admin Dashboard Flow
1. Authenticated admin accesses dashboard
2. TanStack Query fetches data from API endpoints
3. Real-time statistics and charts rendered
4. CRUD operations sync with database
5. UI updates reactively to data changes

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Supabase**: Authentication and real-time features
- **Replit**: Development and deployment platform

### UI Libraries
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization components
- **React Hook Form**: Form state management
- **Zod**: Schema validation

### Development Tools
- **Drizzle Kit**: Database migration management
- **ESBuild**: Production bundling
- **PostCSS**: CSS processing with Autoprefixer

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Hot Reload**: Vite HMR with Express server
- **Port Configuration**: 5000 (internal) → 80 (external)

### Production Build
- **Frontend**: Vite production build to dist/public
- **Backend**: ESBuild bundle to dist/index.js
- **Static Assets**: Served by Express in production
- **Environment**: NODE_ENV=production

### Database Management
- **Migrations**: Drizzle migrations in migrations/ directory
- **Schema**: Centralized in shared/schema.ts
- **Connection**: Environment variable DATABASE_URL required

## Changelog

```
Changelog:
- June 19, 2025. Successfully migrated project from Lovable to Replit environment
- June 19, 2025. Updated campus options to LIMA Campus, Main Campus, and Riverside Campus
- June 15, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```