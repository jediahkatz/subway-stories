# Testing Todo List - Subway Stories Application

## Frontend Testing (Client)

### Setup & Configuration
- [ ] **Set up frontend testing framework** 
  - Install and configure Vitest (or Jest) + React Testing Library
  - Configure test environment for React components
  - Set up test utilities and custom render functions

### Unit Tests - Components
- [ ] **Test core map components**
  - `MTADataMap.jsx` - map rendering, data visualization
  - `MapBarLayer.jsx` - bar chart overlays on map
  - `ColorLegend.jsx` - legend display and interactions
  
- [ ] **Test UI components**
  - `StoriesView.jsx` - story content display
  - `DataControls.jsx` - filtering and control interactions
  - `ViewTabs.jsx` - tab navigation
  - `SearchableDropdown.jsx` - search and selection functionality
  - `MonthSelector.jsx` - date selection logic
  - `Slider.tsx` - range input interactions

- [ ] **Test utility components**
  - `SubwayLineSymbol.jsx` - line symbol rendering
  - `Tooltip.jsx` - tooltip display logic
  - `Password.jsx` - authentication component

### Unit Tests - Custom Hooks
- [ ] **Test animation hooks**
  - `useAnimationManager.ts` - animation state management
  - `useBarsAnimation.ts` - bar chart animations
  - `useDotAnimation.ts` - dot/point animations

- [ ] **Test data hooks**
  - `useFetchData.ts` - data fetching and caching
  - `useKeyboardShortcuts.ts` - keyboard event handling
  - `usePrevious.ts` - previous value tracking

### Unit Tests - Utilities
- [ ] **Test data processing**
  - `data-fetcher.ts` - API calls and data transformation
  - `stations.ts` - station data processing
  - `all-stations.ts` - station lookup utilities
  - `bar-heights.ts` - height calculation logic

- [ ] **Test helper functions**
  - `analytics.js` - analytics tracking
  - `sessionManager.js` - session state management
  - `lru-cache.ts` - caching implementation
  - `debounce.ts` - debouncing utility
  - `map-bounds.ts` - map boundary calculations

## Backend Testing (SQL Server)

### Setup & Configuration
- [ ] **Set up backend testing framework**
  - Install and configure Jest/Mocha + Supertest
  - Set up test database or mocking
  - Configure test environment variables

### API & Server Tests
- [ ] **Test main server functionality**
  - `server.js` - HTTP server setup and routing
  - Database connection and query handling
  - Error handling and response formatting

- [ ] **Test security features**
  - `antiabuse.js` - rate limiting and abuse prevention
  - `banlist.json` - banned IP/user handling
  - Input validation and sanitization

- [ ] **Test utility functions**
  - `lib.js` - shared utility functions
  - Data validation and transformation

## Integration Testing

- [ ] **Frontend-Backend Integration**
  - API endpoint calls from frontend
  - Data flow from server to client
  - Error handling across the stack

- [ ] **Database Integration**
  - SQL queries and data retrieval
  - Data consistency and integrity
  - Performance with large datasets

## Load & Performance Testing

- [ ] **Enhance existing load testing**
  - Review and improve `client/scripts/load-test.ts`
  - Test API endpoints under load
  - Database performance testing

- [ ] **Frontend performance testing**
  - Map rendering performance with large datasets
  - Animation performance testing
  - Memory usage and cleanup

## End-to-End Testing

### Setup
- [ ] **Set up E2E testing framework**
  - Install and configure Playwright or Cypress
  - Set up test environment and data

### User Journey Tests
- [ ] **Core user flows**
  - Loading the application and initial map view
  - Navigating between different views (map, stories, about)
  - Filtering data by time periods and stations
  - Interactive map features (zoom, pan, hover)

- [ ] **Story interaction flows**
  - Viewing individual stories
  - Story progress tracking
  - Story navigation and controls

- [ ] **Data visualization flows**
  - Switching between different data views
  - Animation controls and playback
  - Responsive behavior on different screen sizes

## Visual & Accessibility Testing

- [ ] **Visual regression testing**
  - Screenshot comparisons for UI components
  - Map visualization consistency
  - Cross-browser visual testing

- [ ] **Accessibility testing**
  - Screen reader compatibility
  - Keyboard navigation
  - Color contrast and visual accessibility

## CI/CD & Automation

- [ ] **Automated testing pipeline**
  - Set up GitHub Actions or similar CI/CD
  - Run unit tests on pull requests
  - Run integration tests on deployments

- [ ] **Test reporting and coverage**
  - Code coverage reporting
  - Test result visualization
  - Performance benchmarking

## Documentation & Maintenance

- [ ] **Testing documentation**
  - Write testing guidelines and best practices
  - Document test data setup and management
  - Create troubleshooting guide for test failures

- [ ] **Test maintenance**
  - Regular test suite review and updates
  - Remove outdated or redundant tests
  - Performance optimization of test suite

---

## Priority Levels

**High Priority (Start Here):**
- Frontend testing setup
- Core component unit tests (MTADataMap, StoriesView, DataControls)
- Backend API testing setup
- Basic E2E user flow tests

**Medium Priority:**
- Custom hooks testing
- Integration testing
- Enhanced load testing
- Visual regression testing

**Low Priority:**
- Advanced E2E scenarios
- Performance benchmarking
- Comprehensive documentation