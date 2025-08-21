<!--
Update Rules for systemPatterns.md
- Updated when new architectural patterns, technical decisions, or design patterns are adopted.
- Each new pattern/decision should be clearly dated and described.
- Deprecated patterns should be moved to an "Archive" section at the end.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- 2025-08: Added Business Workspace UI & Module Navigation patterns (position-aware module filtering, tab navigation, header consolidation, fallback module systems).
- 2025-08: Added Admin Portal Fix & System Stability patterns (Next.js App Router error handling, build-time issue resolution, system restart patterns).
- 2025-01: Added Advanced Analytics & Intelligence Platform patterns (real-time analytics, predictive intelligence, business intelligence, AI-powered insights).
- 2025-01: Added Calendar module patterns (tab-bound calendars, auto-provisioning, RRULE/exceptions, free-busy masking, availability, provider sync, booking links).
- 2025-01: Added Module Runtime patterns (iframe host, runtime config endpoint, message bridge, permission/token scoping, origin allowlist).
- 2025-01: Added household management system architecture with role-based access control and multi-context widget system.
- 2024-12-26: Added multi-context dashboard system architecture for business and educational institution integration.
- 2024-12: Added Node.js 18+ compatibility patterns for API proxy and fetch requests, static file serving patterns, and TypeScript optional parameter handling patterns.
- 2024-06: Added type safety enforcement for Drive module, clarified module system architecture, and updated OAuth 2.0 provider patterns.
- [Add future major changes here.]

## Cross-References & Modular Context Pattern
- See [projectbrief.md](./projectbrief.md) for project vision and requirements.
- See [moduleSpecs.md](./moduleSpecs.md) for module and feature specifications.
- See [designPatterns.md](./designPatterns.md) for UI/UX and code design patterns.
- See [chatProductContext.md](./chatProductContext.md), [driveProductContext.md](./driveProductContext.md), [dashboardProductContext.md](./dashboardProductContext.md), and [marketplaceProductContext.md](./marketplaceProductContext.md) for module-specific architecture and patterns.
- Each major proprietary module should have its own product context file and, if needed, a module-specific architecture/patterns section (see README for details on the modular context pattern).

---

# System Architecture and Patterns

## [2025-08] Business Workspace UI & Module Navigation Patterns

### Position-Aware Module Filtering Pattern
**Purpose**: Provide dynamic module navigation based on user position, department, and permissions while maintaining fallback systems for reliability.

**Problem Pattern**:
- Hardcoded module lists don't adapt to user roles and permissions
- Module navigation fails when API data is unavailable
- No integration between business configuration and navigation systems

**Solution Pattern**:
```typescript
// ✅ Position-aware module filtering with fallbacks
const getAvailableModules = (): Module[] => {
  if (!configuration || !session?.user?.id) {
    // Fallback to default modules
    return BUSINESS_MODULES;
  }

  // Use enabledModules directly from business configuration
  const userModules = configuration.enabledModules?.filter(m => m.status === 'enabled') || [];
  
  // Convert BusinessModule[] to Module[]
  const modules: Module[] = userModules.map((bModule: any) => ({
    id: bModule.id,
    name: bModule.name || bModule.id,
    hidden: false
  }));

  return modules.length > 0 ? modules : BUSINESS_MODULES;
};
```

**Integration Pattern**:
```typescript
// ✅ Connect BusinessConfigurationContext with layout components
const { configuration, loading: configLoading } = useBusinessConfiguration();

useEffect(() => {
  setModules(getAvailableModules());
  setIsMobile(window.innerWidth < 700);
  setHydrated(true);
}, [configuration, session?.user?.id]);
```

### Tab Navigation & Path Detection Pattern
**Purpose**: Ensure proper tab highlighting and navigation in business workspace with complex URL structures.

**Problem Pattern**:
- Simple pathname splitting doesn't handle nested routes correctly
- Tab highlighting fails for main workspace page vs sub-pages
- Navigation logic doesn't distinguish between `/workspace` and `/workspace/dashboard`

**Solution Pattern**:
```typescript
// ✅ Intelligent tab detection with path analysis
const getCurrentTab = () => {
  const pathParts = pathname.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  // If we're on the main workspace page (no sub-path), show 'dashboard' as active
  if (pathParts.length === 4 && lastPart === 'workspace') {
    return 'dashboard';
  }
  
  // Otherwise, use the last part as the tab ID
  return lastPart || 'dashboard';
};

const currentTab = getCurrentTab();
```

**Navigation Pattern**:
```typescript
// ✅ Proper navigation with path mapping
const navigateToTab = (tabId: string) => {
  // Map dashboard to the main workspace page (Overview)
  if (tabId === 'dashboard') {
    router.push(`/business/${business.id}/workspace`);
  } else {
    router.push(`/business/${business.id}/workspace/${tabId}`);
  }
};
```

### Header Consolidation Pattern
**Purpose**: Eliminate duplicate headers between layout and page components while maintaining proper content organization.

**Problem Pattern**:
- Layout components and page components both render headers
- Duplicate business information and navigation elements
- Inconsistent styling and positioning

**Solution Pattern**:
```typescript
// ✅ Layout-level header only (BusinessWorkspaceLayout)
<header style={{ /* business branding and tab navigation */ }}>
  {/* Business logo, name, and main tab navigation */}
</header>

// ✅ Page-level content only (workspace/page.tsx)
return (
  <div className="min-h-screen bg-gray-50">
    {/* Main Content - This page represents the Overview tab */}
    <div className="container mx-auto px-6 py-6">
      {/* Page-specific content without headers */}
    </div>
  </div>
);
```

**Content Organization**:
- Layout handles: Business branding, tab navigation, sidebar
- Pages handle: Content-specific UI, forms, data display
- No duplication of navigation or branding elements

### Fallback Module System Pattern
**Purpose**: Ensure navigation remains functional even when business configuration data is unavailable.

**Problem Pattern**:
- Module navigation fails completely when API calls fail
- No graceful degradation for development or error scenarios
- User experience breaks when backend services are unavailable

**Solution Pattern**:
```typescript
// ✅ Robust fallback with error handling
try {
  const installedModules = await getInstalledModules({
    scope: 'business',
    businessId: businessId
  });
  businessModules = installedModules.map(/* transform */);
} catch (moduleError) {
  console.warn('Failed to load business modules, using fallback:', moduleError);
  // Use fallback modules
  businessModules = [
    { id: 'dashboard', name: 'Dashboard', /* ... */ },
    { id: 'members', name: 'Members', /* ... */ },
    { id: 'analytics', name: 'Analytics', /* ... */ }
  ];
}
```

**Fallback Strategy**:
- Primary: Load from BusinessConfigurationContext
- Secondary: Use hardcoded BUSINESS_MODULES
- Error handling: Graceful degradation with logging

## [2025-08] Admin Portal Fix & System Stability Patterns

### Next.js App Router Error Handling Pattern
**Purpose**: Prevent build-time errors caused by invalid HTML tags in error pages and ensure proper routing in Next.js App Router.

**Problem Pattern**:
- `global-error.tsx` files using `<html>` and `<body>` tags cause build failures
- Server-side redirects in page components can cause routing issues
- Build artifacts from previous failed builds can cause conflicts

**Solution Pattern**:
```typescript
// ❌ Avoid: Server-side redirects in page components
export default function AdminPortalPage() {
  redirect('/admin-portal/dashboard'); // Causes build-time issues
}

// ✅ Use: Client-side navigation with useEffect
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin-portal/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
```

**Error Page Management**:
- Remove `global-error.tsx` files in App Router (not needed)
- Use standard `error.tsx` for component-level error boundaries
- Avoid HTML document tags in error components

### System Restart & Build Artifact Cleanup Pattern
**Purpose**: Resolve system instability caused by conflicting build artifacts and ensure clean development environment.

**Problem Pattern**:
- Multiple development servers running simultaneously
- Conflicting `.next` build directories
- Stale build artifacts causing routing issues

**Solution Pattern**:
```bash
# 1. Kill all conflicting processes
pkill -f "next dev"
pkill -f "ts-node-dev"

# 2. Clean build artifacts
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart fresh
npm run dev
```

**Cleanup Sequence**:
1. **Process Termination**: Stop all conflicting development servers
2. **Artifact Removal**: Delete conflicting build directories
3. **Fresh Start**: Restart development servers with clean state
4. **Verification**: Test all routes to ensure proper functionality

### Admin Portal Routing Stability Pattern
**Purpose**: Ensure admin portal routes are always accessible and properly configured.

**Implementation Pattern**:
```typescript
// Admin portal page with proper client-side navigation
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin-portal/dashboard');
  }, [router]);

  // Provide loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
```

**Route Verification Pattern**:
```bash
# Test all admin routes for proper functionality
curl -I http://localhost:3000/admin-portal
curl -I http://localhost:3000/admin-portal/dashboard
curl -I http://localhost:3000/admin-portal/ai-learning

# Expected: All routes return 200 OK
```

### Development Environment Stability Pattern
**Purpose**: Maintain stable development environment with proper separation of concerns.

**Port Management**:
- **Frontend (Next.js)**: Port 3000 for admin portal and user interface
- **Backend (Express)**: Port 5000 for API endpoints and AI services
- **Database**: PostgreSQL with Prisma ORM for data persistence

**Service Separation**:
```bash
# Frontend development
cd web && npm run dev

# Backend development  
cd server && npm run dev

# Database management
npx prisma studio --port 5556
```

**Health Check Pattern**:
```bash
# Frontend health check
curl -I http://localhost:3000/admin-portal

# Backend health check
curl -I http://localhost:5000/api/centralized-ai/patterns

# Expected: Both return 200 OK status
```

### Build Error Resolution Pattern
**Purpose**: Systematically resolve Next.js build errors and ensure production readiness.

**Error Resolution Sequence**:
1. **Identify Root Cause**: Analyze build error messages and stack traces
2. **Remove Problematic Files**: Delete or fix files causing build failures
3. **Clean Build Environment**: Remove conflicting build artifacts
4. **Test Incrementally**: Verify fixes with small builds before full build
5. **Document Solutions**: Record patterns for future reference

**Common Build Issues**:
- Invalid HTML tags in error pages
- Server-side redirects in page components
- Conflicting build artifacts
- Multiple development servers

**Prevention Patterns**:
- Use client-side navigation for dynamic redirects
- Avoid HTML document tags in App Router components
- Maintain single development server per service
- Regular cleanup of build artifacts

## [2025-01] Advanced Analytics & Intelligence Platform Pattern

### **Advanced Analytics & Intelligence Platform Pattern** 🆕
**Pattern Type**: Real-Time Analytics, Predictive Intelligence, Business Intelligence, AI-Powered Insights  
**Status**: ✅ Implemented

#### **Core Architecture Pattern**
The analytics platform follows a **layered architecture** with four distinct engines that work together to provide comprehensive business intelligence:

```
Data Sources → Real-Time Processing → Analytics Engines → AI-Powered Insights → Admin Portal
     ↓                    ↓              ↓              ↓              ↓
User Activity → Stream Processing → Predictive Models → Pattern Discovery → Business Intelligence
```

#### **Phase 3A: Real-Time Analytics Engine Pattern**
**Purpose**: Process live data streams and provide real-time insights with configurable metrics and alerts

**Core Components**:
- **DataStream**: Configurable data streams with real-time processing
- **DataPoint**: Individual data points with metadata and quality metrics
- **RealTimeMetric**: Configurable metrics with thresholds and alerting
- **AnalyticsDashboard**: Interactive dashboards with customizable widgets
- **StreamProcessor**: Real-time data processing and transformation
- **RealTimeAlert**: Configurable alerting with acknowledgment and resolution

**Implementation Pattern**:
```typescript
// Real-time data stream processing
class RealTimeAnalyticsEngine extends EventEmitter {
  async addDataPoint(streamId: string, data: Record<string, any>, metadata: {
    source: string;
    version: string;
    quality: number;
    tags: string[];
  }): Promise<DataPoint> {
    // Process data through stream processors
    await this.processStreamData(streamId, dataPoint);
    
    // Check metrics and generate alerts
    await this.checkMetrics(streamId, dataPoint);
    
    return dataPoint;
  }
}
```

#### **Phase 3B: Predictive Intelligence Platform Pattern**
**Purpose**: Provide advanced forecasting, anomaly detection, and predictive modeling capabilities

**Core Components**:
- **ForecastingModel**: ML models for time series forecasting (ARIMA, LSTM, Random Forest)
- **AnomalyDetectionModel**: Statistical and ML-based anomaly detection
- **PredictivePipeline**: Orchestrated ML pipelines with scheduling and execution
- **ModelExperiment**: A/B testing and model performance tracking
- **IntelligenceInsight**: AI-generated insights from predictive models

**Implementation Pattern**:
```typescript
// Predictive pipeline execution
class PredictiveIntelligenceEngine extends EventEmitter {
  async executePipeline(pipelineId: string): Promise<{
    success: boolean;
    duration: number;
    output?: any;
    error?: string;
  }> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');
    
    // Execute pipeline steps sequentially
    for (const step of pipeline.steps) {
      await this.executePipelineStep(step);
    }
    
    return { success: true, duration: Date.now() - startTime };
  }
}
```

#### **Phase 3C: Business Intelligence Suite Pattern**
**Purpose**: Provide business metrics, KPI dashboards, and advanced reporting capabilities

**Core Components**:
- **BusinessMetric**: Business KPIs and performance metrics
- **KPIDashboard**: Interactive KPI dashboards with real-time updates
- **ReportTemplate**: Advanced reporting engine with customizable templates
- **BusinessInsight**: AI-generated business insights with actionable recommendations
- **ChartWidget**: Configurable chart widgets for data visualization

**Implementation Pattern**:
```typescript
// Business intelligence dashboard
class BusinessIntelligenceEngine extends EventEmitter {
  async getDashboardData(dashboardId: string): Promise<{
    dashboard: KPIDashboard;
    widgetData: Record<string, any>;
  }> {
    const dashboard = this.kpiDashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');
    
    // Get data for each widget
    const widgetData: Record<string, any> = {};
    for (const widget of dashboard.layout.widgets) {
      widgetData[widget.id] = await this.getWidgetData(widget);
    }
    
    return { dashboard, widgetData };
  }
}
```

#### **Phase 4: AI-Powered Insights Engine Pattern**
**Purpose**: Automate pattern discovery, generate intelligent insights, and provide actionable recommendations

**Core Components**:
- **PatternDiscovery**: AI-discovered patterns using ML algorithms
- **IntelligentInsight**: AI-generated business insights with correlations
- **Recommendation**: Actionable business recommendations with implementation tracking
- **ContinuousLearning**: Self-improving AI systems with feedback integration
- **InsightValidation**: Validation and feedback systems for insights

**Implementation Pattern**:
```typescript
// AI-powered pattern discovery
class AIPoweredInsightsEngine extends EventEmitter {
  async discoverPatterns(dataSource: string, variables: string[], algorithm: string, type: string): Promise<PatternDiscovery> {
    // Create discovery instance
    const discovery: PatternDiscovery = {
      // ... initialization
    };
    
    // Simulate ML processing (in real implementation, call actual ML algorithms)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate patterns based on type
    if (type === 'clustering') {
      discovery.patterns = this.generateMockClusteringPatterns(variables);
    } else if (type === 'temporal') {
      discovery.patterns = this.generateMockTemporalPatterns(variables);
    }
    
    // Calculate overall metrics
    discovery.confidence = discovery.patterns.reduce((sum, p) => sum + p.confidence, 0) / discovery.patterns.length;
    discovery.status = 'completed';
    
    return discovery;
  }
}
```

#### **Centralized AI Learning Integration Pattern**
**Purpose**: Integrate analytics platform with centralized AI learning for collective intelligence

**Integration Points**:
- **Learning Event Forwarding**: Analytics events automatically sent to centralized learning
- **Pattern Correlation**: Analytics patterns correlated with global user behavior
- **Insight Enhancement**: Collective insights enhance individual analytics
- **Privacy Preservation**: All integration maintains user privacy and consent

**Implementation Pattern**:
```typescript
// Analytics with centralized learning integration
class AnalyticsWithCentralizedLearning {
  async processAnalyticsEvent(event: AnalyticsEvent) {
    // Process analytics event
    await this.analyticsEngine.processEvent(event);
    
    // Forward to centralized learning (with privacy controls)
    if (await this.checkUserConsent(event.userId)) {
      await this.centralizedLearning.processGlobalLearningEvent({
        ...event,
        userId: this.hashUserId(event.userId), // Privacy preservation
        data: this.anonymizeData(event.data)   // Data anonymization
      });
    }
  }
}
```

#### **API Architecture Pattern**
**Purpose**: Provide comprehensive REST API for all analytics capabilities

**API Structure**:
```
/api/centralized-ai/
├── analytics/           # Real-time analytics
│   ├── streams         # Data stream management
│   ├── metrics         # Real-time metrics
│   ├── dashboards      # Dashboard management
│   └── alerts          # Real-time alerting
├── predictive/          # Predictive intelligence
│   ├── forecasting-models    # Forecasting models
│   ├── anomaly-models       # Anomaly detection
│   ├── pipelines            # Predictive pipelines
│   └── insights             # Intelligence insights
├── business/            # Business intelligence
│   ├── metrics         # Business metrics
│   ├── dashboards      # KPI dashboards
│   ├── insights        # Business insights
│   └── reports         # Report generation
└── ai-insights/        # AI-powered insights
    ├── patterns        # Pattern discoveries
    ├── insights        # Intelligent insights
    ├── recommendations # AI recommendations
    └── continuous-learning # Learning systems
```

#### **Data Flow Pattern**
**Purpose**: Efficient data processing and storage for real-time analytics

**Data Flow Architecture**:
```
Raw Data → Stream Processing → Real-Time Storage → Analytics Engine → Insights Generation
    ↓              ↓                ↓              ↓              ↓
User Activity → Data Points → Metrics Calculation → Pattern Discovery → Business Intelligence
```

**Implementation Pattern**:
```typescript
// Data flow implementation
class AnalyticsDataFlow {
  async processDataFlow(rawData: any) {
    // 1. Stream processing
    const dataPoint = await this.streamProcessor.process(rawData);
    
    // 2. Real-time storage
    await this.storage.store(dataPoint);
    
    // 3. Metrics calculation
    const metrics = await this.metricsEngine.calculate(dataPoint);
    
    // 4. Pattern discovery
    const patterns = await this.patternEngine.discover(metrics);
    
    // 5. Insights generation
    const insights = await this.insightsEngine.generate(patterns);
    
    return insights;
  }
}
```

#### **Performance Optimization Pattern**
**Purpose**: Ensure high-performance analytics with real-time capabilities

**Optimization Strategies**:
- **In-Memory Processing**: Critical metrics processed in memory for speed
- **Batch Processing**: Non-critical data processed in batches
- **Caching Strategy**: Multi-level caching for frequently accessed data
- **Async Processing**: Non-blocking operations for real-time responsiveness

**Implementation Pattern**:
```typescript
// Performance optimization implementation
class OptimizedAnalyticsEngine {
  private cache = new Map<string, any>();
  private batchQueue: any[] = [];
  
  async processMetric(metric: RealTimeMetric) {
    // Check cache first
    if (this.cache.has(metric.id)) {
      return this.cache.get(metric.id);
    }
    
    // Process in memory for speed
    const result = await this.processInMemory(metric);
    
    // Cache result
    this.cache.set(metric.id, result);
    
    // Queue for batch processing
    this.batchQueue.push(metric);
    
    return result;
  }
}
```

### **Block ID System Pattern** 🆕
**Pattern Type**: User Identification & Location Management  
**Status**: ✅ Implemented

#### **Core Components**
- **UserNumberService**: Atomic Block ID generation with transaction safety
- **GeolocationService**: IP-based location detection with fallback mechanisms
- **LocationService**: CRUD operations for location data management
- **AuditService**: Complete audit logging for Block ID usage and security
- **Block ID Validation**: Format validation and component parsing utilities

#### **Database Schema Pattern**
```prisma
// Location hierarchy with 3-digit codes
model Country {
  id        String   @id @default(uuid())
  name      String
  phoneCode String   @unique // e.g., "1", "44", "33"
  regions   Region[]
  users     User[]
}

model Region {
  id        String   @id @default(uuid())
  name      String
  code      String   // 3-digit code, e.g., "001", "002"
  country   Country  @relation(fields: [countryId], references: [id])
  countryId String
  towns     Town[]
  users     User[]
  @@unique([countryId, code])
}

model Town {
  id        String   @id @default(uuid())
  name      String
  code      String   // 3-digit code, e.g., "001", "002"
  region    Region   @relation(fields: [regionId], references: [id])
  regionId  String
  users     User[]
  userSerials UserSerial[]
  @@unique([regionId, code])
}

model UserSerial {
  id        String   @id @default(uuid())
  town      Town     @relation(fields: [townId], references: [id])
  townId    String
  lastSerial Int     @default(0)
  @@unique([townId])
}

// User model with Block ID integration
model User {
  // ... existing fields
  userNumber      String?  @unique // e.g., "001-001-001-0000001"
  country         Country? @relation(fields: [countryId], references: [id])
  countryId       String?
  region          Region?  @relation(fields: [regionId], references: [id])
  regionId        String?
  town            Town?    @relation(fields: [townId], references: [id])
  townId          String?
  locationDetectedAt DateTime?
  locationUpdatedAt DateTime?
  auditLogs       AuditLog[]
}
```

#### **Block ID Format Pattern**
- **Format**: `[CountryCode]-[RegionCode]-[TownCode]-[UserSerial]`
- **Example**: `001-001-001-0000001` (USA-NY-Manhattan-User #1)
- **Capacity**: 9.9 quintillion users globally
- **Validation**: Strict 3-3-3-7 format with component parsing

#### **Cross-Module Integration Pattern**
```typescript
// Business invitation with Block ID
await sendBusinessInvitationEmail(
  email, businessName, inviterName, role, 
  title, department, token, message, 
  user.userNumber // Include inviter's Block ID
);

// Connection request with Block ID
await NotificationService.handleNotification({
  type: 'member_request',
  data: {
    senderBlockId: relationship.sender.userNumber,
    // ... other data
  }
});
```

#### **Audit Logging Pattern**
```typescript
// Block ID generation audit
await AuditService.logBlockIdGeneration(
  userId, blockId, location
);

// Location change audit (admin only)
await AuditService.logLocationChange(
  userId, oldLocation, newLocation, changedBy
);

// Business connection audit
await AuditService.logBusinessConnection(
  userId, businessId, action, targetUserBlockId
);
```

#### **Admin Management Pattern**
```typescript
// Admin-only location updates
PUT /api/admin/users/:userId/location
{
  "countryId": "uuid",
  "regionId": "uuid", 
  "townId": "uuid"
}

// Block ID audit logs
GET /api/admin/users/:userId/audit-logs
GET /api/admin/block-ids/:blockId/audit-logs
```

#### **Security Pattern**
- **Immutable Design**: Block ID cannot be changed by users
- **Admin Oversight**: Location changes require admin approval
- **Audit Trail**: Complete history of all Block ID usage
- **Cross-Module Verification**: Block ID used for secure identification

### **Payment & Billing System Pattern**

## AI Control Center Architecture

### **Tabbed Interface Pattern**

The AI Control Center uses a **custom tabbed interface pattern** that provides smooth navigation between different AI management functions while maintaining state consistency.

#### **Implementation Details**
```typescript
// Tab State Management
const [activeTab, setActiveTab] = useState('overview');

// Tab Navigation Component
<div className="border-b border-gray-200">
  <nav className="-mb-px flex space-x-8">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === tab.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {tab.icon && <tab.icon className="h-4 w-4" />}
        {tab.label}
      </button>
    ))}
  </nav>
</div>

// Tab Content Rendering
{activeTab === 'overview' && <OverviewTab />}
{activeTab === 'autonomy' && <AutonomyTab />}
{activeTab === 'personality' && <PersonalityTab />}
```

#### **Benefits of This Pattern**
- **State Persistence**: Tab state maintained during user interactions
- **Smooth Transitions**: CSS transitions for professional feel
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Only active tab content rendered
- **Maintainability**: Easy to add new tabs or modify existing ones

### **Real-time Settings Management Pattern**

The autonomy controls implement a **real-time settings management pattern** that provides immediate feedback and automatic persistence.

#### **Implementation Details**
```typescript
// Real-time State Updates
const handleSliderChange = (key: keyof AutonomySettings, value: number[]) => {
  setSettings(prev => ({ ...prev, [key]: value[0] }));
  // Could add auto-save here for immediate persistence
};

// Immediate Visual Feedback
const getAutonomyLevel = (value: number) => {
  if (value >= 80) return { level: 'High', color: 'bg-green-100 text-green-800' };
  if (value >= 60) return { level: 'Medium-High', color: 'bg-blue-100 text-blue-800' };
  // ... more levels
};

// Real-time Badge Updates
<Badge className={autonomyInfo.color}>
  {autonomyInfo.level}
</Badge>
```

#### **Benefits of This Pattern**
- **Immediate Feedback**: Users see changes instantly
- **Visual Clarity**: Color-coded levels for easy understanding
- **Risk Awareness**: Real-time risk level indicators
- **User Confidence**: Clear understanding of current settings

### **Multi-Section Form Pattern**

The personality questionnaire uses a **multi-section form pattern** that breaks complex forms into manageable, progress-tracked sections.

#### **Implementation Details**
```typescript
// Section Management
const [currentSection, setCurrentSection] = useState(0);
const [answers, setAnswers] = useState<Record<string, Answer>>({});

// Progress Tracking
const canProceed = () => {
  const requiredQuestions = currentSectionData.questions.filter(q => q.required);
  return requiredQuestions.every(q => answers[q.id]);
};

// Section Navigation
const nextSection = () => {
  if (currentSection < questionSections.length - 1) {
    setCurrentSection(prev => prev + 1);
  }
};

// Data Persistence
const submitQuestionnaire = async () => {
  const personalityData = calculatePersonalityTraits();
  const autonomyData = calculateAutonomySettings();
  
  // Save both personality and autonomy data
  await Promise.all([
    savePersonality(personalityData),
    saveAutonomy(autonomyData)
  ]);
};
```

#### **Benefits of This Pattern**
- **User Engagement**: Manageable sections prevent overwhelm
- **Progress Tracking**: Clear indication of completion status
- **Data Validation**: Required field validation per section
- **Flexible Navigation**: Users can move between sections
- **Data Integration**: Results automatically configure other systems

### **API Integration Pattern**

The AI Control Center uses a **unified API integration pattern** that provides consistent error handling and data management across all AI features.

#### **Implementation Details**
```typescript
// Unified API Call Pattern
const loadAutonomySettings = async () => {
  try {
    const data = await authenticatedApiCall<AutonomySettings>('/api/ai/autonomy');
    setSettings(data);
  } catch (error) {
    console.error('Failed to load autonomy settings:', error);
    // Keep default settings if API fails
  }
};

// Consistent Error Handling
const saveSettings = async () => {
  setLoading(true);
  try {
    await authenticatedApiCall('/api/ai/autonomy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  } catch (error) {
    console.error('Failed to save settings:', error);
  } finally {
    setLoading(false);
  }
};
```

#### **Benefits of This Pattern**
- **Consistent UX**: Same loading states and error handling everywhere
- **Graceful Degradation**: System works even when APIs fail
- **User Feedback**: Clear success/error messages
- **Maintainability**: Centralized API logic
- **Type Safety**: Full TypeScript integration

### **Component Composition Pattern**

The AI Control Center uses a **component composition pattern** that separates concerns and promotes reusability.

#### **Implementation Details**
```typescript
// Main AI Page Component
export default function AIPage() {
  // State management for tabs and data
  const [activeTab, setActiveTab] = useState('overview');
  const [aiStats, setAiStats] = useState<AIStats>({...});
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header and Navigation */}
      <AIHeader />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Content */}
      <TabContent activeTab={activeTab} aiStats={aiStats} />
    </div>
  );
}

// Specialized Tab Components
const OverviewTab = ({ aiStats }) => (
  <>
    <AISystemStatus stats={aiStats} />
    <LearningProgress progress={aiStats.learningProgress} />
    <RecentActivity activities={aiStats.recentConversations} />
    <QuickActions onTabChange={setActiveTab} />
  </>
);

const AutonomyTab = () => (
  <Card className="p-6">
    <AutonomyControls />
  </Card>
);

const PersonalityTab = () => (
  <Card className="p-6">
    <PersonalityQuestionnaire onComplete={handlePersonalityComplete} />
  </Card>
);
```

#### **Benefits of This Pattern**
- **Separation of Concerns**: Each component has a single responsibility
- **Reusability**: Components can be used in other parts of the app
- **Testability**: Easy to test individual components
- **Maintainability**: Changes isolated to specific components
- **Performance**: Only necessary components re-render

### **Data Flow Pattern**

The AI Control Center implements a **unidirectional data flow pattern** that ensures predictable state management and data consistency.

#### **Implementation Details**
```typescript
// Data Flow Architecture
User Input → Component State → API Call → Backend Processing → Database Update
    ↓
Frontend State Updated → UI Re-renders → User Sees Changes
    ↓
AI System Reads Updated Data → Makes Decisions → Provides Recommendations
```

#### **Benefits of This Pattern**
- **Predictable State**: Clear data flow direction
- **Debugging**: Easy to trace data changes
- **Performance**: Optimized re-rendering
- **Consistency**: Data always in sync across components
- **Scalability**: Easy to add new data sources

### **Responsive Design Pattern**

The AI Control Center uses a **mobile-first responsive design pattern** that ensures optimal user experience across all devices.

#### **Implementation Details**
```typescript
// Responsive Grid Layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* AI System Status Cards */}
</div>

// Responsive Button Layouts
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Quick Action Buttons */}
</div>

// Responsive Form Layouts
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Approval Threshold Inputs */}
</div>
```

#### **Benefits of This Pattern**
- **Mobile Optimization**: Works perfectly on mobile devices
- **Desktop Enhancement**: Takes advantage of larger screens
- **User Experience**: Consistent experience across all devices
- **Accessibility**: Proper touch targets and spacing
- **Future-Proof**: Adapts to new device sizes

### **Error Boundary Pattern**

The AI Control Center implements **error boundary patterns** that gracefully handle errors and provide user-friendly error messages.

#### **Implementation Details**
```typescript
// API Error Handling
const loadAIData = async () => {
  try {
    // Load data from APIs
    setAiStats({...});
    setRecentConversations([...]);
  } catch (error) {
    console.error('Failed to load AI data:', error);
    setError('Failed to load AI data');
  } finally {
    setIsLoading(false);
  }
};

// User-Friendly Error Display
if (error) {
  return (
    <div className="container mx-auto p-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <span>{error}</span>
      </div>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

#### **Benefits of This Pattern**
- **User Experience**: Clear error messages and recovery options
- **System Stability**: Errors don't crash the entire application
- **Debugging**: Proper error logging for developers
- **Recovery**: Users can retry failed operations
- **Professional Feel**: Handles edge cases gracefully