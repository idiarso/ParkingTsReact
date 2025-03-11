# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with TypeScript and PostgreSQL database
- Core entity models (User, Vehicle, ParkingSession, Rate)
- Authentication middleware with JWT
- Parking rate management system
- Real-time parking session tracking
- Enhanced receipt generation system with customization options:
  - Company branding (logo, name, address, contact info)
  - Barcode and QR code support
  - VAT calculation and display
  - Multi-currency and locale support
  - Customizable themes and layouts
  - Social media integration in footer
- Batch receipt download functionality:
  - Multiple format support (PDF, Excel)
  - Customizable filters (date range, vehicle type, status)
  - Sorting options
  - ZIP archive generation
  - Bulk processing capabilities

### Changed
- Updated database configuration for better TypeORM entity path resolution
- Enhanced parking session management with additional fields
- Improved receipt generation workflow with format customization
- Restructured API endpoints for better organization

### Fixed
- PostgreSQL authentication issues
- TypeORM entity path resolution
- Database connection configuration
- TypeScript compilation errors in gate components

## [0.1.0] - 2024-03-10

### Added
- Initial project structure
- Basic parking management functionality
- Entry and exit gate components
- Rate calculation system
- Database schema and migrations

## [0.1.6] - 2024-03-10

### Added
- Implemented Receipt and Backup System
  - Created receipt template component
    - Thermal printer compatible layout
    - Company information section
    - Detailed parking information
    - Fee breakdown
    - Print-specific styling
  - Added data backup and restore functionality
    - JSON backup export
    - Backup file import
    - Complete system restore
    - Progress indicators
    - Error handling
  - Added data export capabilities
    - CSV export for sessions and vehicles
    - Formatted date handling
    - Special character escaping
  - Implemented backup/restore dialog
    - User-friendly interface
    - Progress feedback
    - Error notifications
    - File type validation

## [0.1.5] - 2024-03-10

### Added
- Implemented Settings Page UI
  - Created parking rates management interface
    - Add/edit/delete parking rates
    - Configure base and hourly rates per vehicle type
  - Added general settings configuration
    - Maximum capacity management
    - Operating hours with time picker
    - Overnight parking toggle
  - Real-time settings updates
  - Responsive layout design
  - Loading and error states

## [0.1.4] - 2024-03-10

### Added
- Implemented Sessions Management UI
  - Created data grid for active parking sessions
  - Added session details dialog
  - Implemented real-time duration calculation
  - Added session status indicators
  - Created session actions (end session)
  - Added loading and error states
  - Implemented row click for detailed view

## [0.1.3] - 2024-03-10

### Added
- Implemented parking sessions management
  - Added parking sessions slice with offline support
  - Implemented session start/end functionality
  - Added automatic fee calculation
  - Created session status tracking
- Added settings management
  - Implemented settings slice for configuration
  - Added default parking rates for different vehicle types
  - Added operating hours configuration
  - Added capacity management
  - Added overnight parking settings

## [0.1.2] - 2024-03-10

### Added
- Implemented offline-first functionality
  - Added IndexedDB storage for vehicles, parking sessions, and settings
  - Created service worker for offline caching
  - Added offline fallback page
  - Configured Redux store with offline persistence
  - Added vehicle management with offline support
  - Implemented UUID generation for offline-first IDs

## [0.1.1] - 2024-03-10

### Added
- Set up routing structure for Admin Dashboard
  - Created MainLayout component with responsive drawer
  - Implemented navigation menu with Material-UI icons
  - Set up lazy-loaded routes for all main sections
  - Created basic page components:
    - Dashboard with statistics cards
    - Vehicles management placeholder
    - Sessions management placeholder
    - Users management (pending)
    - Invoices (pending)
    - Reports (pending)
    - Settings (pending)
  - Configured theme provider with default light theme

## [0.1.0] - 2024-03-10

### Added
- Initial project setup
  - Created base server structure with Node.js and Express
  - Set up database migrations and configurations
  - Created React applications scaffolding:
    - Admin Dashboard
    - Entry Gate
    - Exit Gate
  - Installed core dependencies for Admin Dashboard:
    - Material-UI (@mui/material, @mui/icons-material)
    - Emotion (@emotion/react, @emotion/styled)
    - Redux Toolkit (@reduxjs/toolkit, react-redux)
    - Socket.IO Client (socket.io-client)
    - Axios for HTTP requests
    - React Router (react-router-dom)
    - MUI X Components (@mui/x-data-grid, @mui/x-date-pickers)
    - Charts library (recharts)
    - Date utilities (date-fns)

### Project Structure
- `/admin` - Admin Dashboard application
- `/gate-in` - Entry Gate application
- `/gate-out` - Exit Gate application
- `/server` - Backend API server
- `/shared` - Shared utilities and types

### Next Steps
- Add offline data synchronization
- Implement vehicle type management
- Add user management and permissions
- Create reporting interface
- Implement system notifications 