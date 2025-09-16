# Timesheet OCR Processor - Product Requirements Document

## Core Purpose & Success

- **Mission Statement**: Extract and process timesheet data from multiple images using AI vision with employee identification, wage calculation, and secure local storage
- **Success Indicators**: Accurate data extraction, reliable employee matching, wage calculations, persistent local storage of settings
- **Experience Qualities**: Efficient, Professional, Secure, Comprehensive

## Project Classification & Approach

- **Complexity Level**: Light Application (multiple features with basic state)
- **Primary User Activity**: Acting - users upload multiple images and get processed timesheet data with wage calculations

## Core Problem Analysis

Users need to digitize paper timesheets efficiently while maintaining data accuracy, employee attribution, and wage calculations. Manual data entry is time-consuming and error-prone, especially when processing multiple employees' timesheets.

## Essential Features

### Multi-Image Processing

- Drag-and-drop support for multiple image uploads
- Visual grid display of selected images
- Batch processing of multiple timesheet images
- Employee-specific data grouping from multiple images
- Progress feedback during batch processing

### Wage Management

- Hourly wage configuration with persistent storage
- Automatic wage calculations based on total hours worked
- Per-employee wage totals displayed alongside hour totals
- Wage amounts shown in results tables and exports

### Employee Management (Simplified)

- Local storage of employee database using idb-keyval
- Add, edit, and remove employees (name only, no ID fields)
- AI-powered employee identification from timesheet images
- Robust error handling with retry logic for employee matching
- Clean, minimal employee management interface

### Enhanced Data Presentation

- Employee-grouped results tables
- Employee name displayed next to export button (not as column)
- Total hours and wage calculations per employee
- Improved export with employee-specific filenames
- Wage information included in CSV exports

### API Key Management

- Secure local storage of OpenAI API keys using idb-keyval
- Clear warnings when API key is missing
- Validation before processing attempts
- Easy API key setup and update workflow

## Design Direction

### Visual Tone & Identity

- **Emotional Response**: Professional confidence and efficiency with enhanced productivity focus
- **Design Personality**: Clean, modern, business-focused interface with emphasis on batch processing
- **Visual Metaphors**: Document processing, data organization, and financial calculation
- **Simplicity Spectrum**: Minimal interface that prioritizes function while handling complexity

### Color Strategy

- **Color Scheme Type**: Professional blue and orange palette
- **Primary Color**: Deep blue (oklch(0.45 0.15 240)) - conveys trust and stability
- **Secondary Colors**: Light blue-gray for supporting elements
- **Accent Color**: Warm orange (oklch(0.70 0.15 60)) - highlights important actions and wages
- **Color Psychology**: Blue represents reliability and professionalism, orange adds warmth and draws attention to wage information

### Typography System

- **Font Pairing Strategy**: Inter font family for consistency and readability
- **Typographic Hierarchy**: Clear size progression from headlines to body text
- **Font Personality**: Modern, clean, professional sans-serif
- **Readability Focus**: Generous line spacing and comfortable reading sizes
- **Which fonts**: Inter (already loaded from Google Fonts)

### Visual Hierarchy & Layout

- **Attention Direction**: Header with Controls → Upload Area → Employee-grouped Results
- **White Space Philosophy**: Generous spacing between sections for clarity
- **Grid System**: Container-based layout with consistent margins
- **Responsive Approach**: Mobile-first design that scales up to accommodate multiple results
- **Content Density**: Balanced information display with wage data integration

### UI Elements & Component Selection

- **Enhanced Controls**: Three-button header layout (API Key, Employees, Wage)
- **Multi-upload Interface**: Grid-based image preview with individual remove buttons
- **Employee Tables**: Grouped results with employee headers and wage calculations
- **Wage Dialog**: Simple number input for hourly rate configuration
- **Enhanced Export**: Employee-specific filenames and wage data inclusion

## Key Technical Decisions

- **Storage**: idb-keyval for persistent local storage (API keys, employees, wage)
- **AI Processing**: OpenAI GPT-4o for both OCR and employee identification
- **Multi-processing**: Sequential image processing with progress feedback
- **Employee Grouping**: Smart grouping of entries by detected employee
- **Wage Calculations**: Real-time calculations with persistent rate storage

## Enhanced User Workflow

1. User sets up OpenAI API key (one-time setup)
2. User manages employee database (simplified, name-only)
3. User sets hourly wage rate
4. User uploads multiple timesheet images
5. System processes all images and groups by employee
6. System calculates wages for each employee
7. User reviews employee-grouped results with wage totals
8. User exports employee-specific data with wage information

## Success Metrics

- Successful batch processing of multiple timesheet images
- Accurate employee identification and data grouping
- Precise wage calculations and display
- Efficient workflow for processing multiple employees
- Employee-specific data export with comprehensive wage information
