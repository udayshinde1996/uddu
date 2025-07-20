# Work Management System

## Overview

This is a mobile-first work management application built with React (frontend), Express.js (backend), and in-memory storage. The system enables tracking of 100 employees through QR code scanning for daily work completion logging and generates Excel reports of work activities. Designed for construction and field work management with a professional interface optimized for industrial environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

✓ Implemented complete mobile-first work management system
✓ Added QR code scanning with camera simulation for work card lookup
✓ Built professional dashboard with real-time statistics and work cards
✓ Created comprehensive employee management with filtering and search
✓ Developed Excel report generation system with multiple templates
✓ Applied custom color scheme: Primary #2563EB, Secondary #059669, Background #F8FAFC
✓ Fixed all TypeScript issues and ensured type safety throughout application
✓ Implemented responsive design with touch-friendly buttons for industrial use
✓ Added manufacturing-specific data fields: shift time, machine number, operation number
✓ Implemented time loss activity tracking with issue types and duration
✓ Added defective part number tracking for quality control
✓ Created comprehensive overtime section with all manufacturing details required

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for server bundling

### Database & ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Connection**: @neondatabase/serverless driver

## Key Components

### Database Schema
The system uses four main entities:
- **employees**: Worker information with status tracking
- **workCards**: Task assignments with QR codes and progress tracking
- **workSessions**: Activity logs for work card interactions
- **reports**: Generated reports with metadata

### Frontend Pages
- **Dashboard**: Overview statistics and recent work cards
- **QR Scanner**: Camera-based QR code scanning for work card lookup
- **Employees**: Employee management with filtering and search
- **Reports**: Report generation and management interface

### Backend Routes
- **Employee API**: CRUD operations for worker management
- **Work Card API**: Task management with QR code generation
- **Work Session API**: Activity tracking and logging
- **Report API**: Report generation and file export
- **Dashboard API**: Aggregated statistics

### Shared Components
- **Schema Definitions**: Drizzle schema with Zod validation
- **Type Safety**: Shared types between frontend and backend
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## Data Flow

1. **Work Card Creation**: Admin creates work cards with auto-generated QR codes
2. **QR Scanning**: Workers scan QR codes to access work cards
3. **Work Sessions**: System logs all work card interactions and status changes
4. **Progress Tracking**: Real-time updates of work completion percentage
5. **Dashboard Updates**: Aggregated statistics refresh automatically
6. **Report Generation**: Scheduled and on-demand reports with Excel export

## External Dependencies

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

### Backend Libraries
- **QRCode**: QR code generation for work cards
- **ExcelJS**: Excel file generation for reports
- **Connect PG Simple**: PostgreSQL session store
- **Date-fns**: Date manipulation utilities

### Development Tools
- **React Hook Form**: Form management with Zod validation
- **Embla Carousel**: Touch-friendly carousel component
- **Replit Plugins**: Development environment integration

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for backend TypeScript execution
- Drizzle Kit for database schema management
- Environment-based configuration

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Database: Drizzle migrations applied via `db:push`
- Static file serving through Express in production

### Environment Configuration
- PostgreSQL connection via `DATABASE_URL`
- Replit-specific development features
- Production/development mode switching
- Session management with PostgreSQL store

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling type-safe communication and efficient development workflows.