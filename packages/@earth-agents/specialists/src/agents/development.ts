import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Development & Architecture Specialists

export const backendArchitect: SpecialistDefinition = {
  name: 'backend-architect',
  description: 'Expert backend system architect with 15+ years experience designing scalable APIs, microservices, and database systems. Specializes in high-performance, security-first architectures that handle millions of users.',
  category: 'architecture',
  focusAreas: [
    'RESTful API design with OpenAPI specifications',
    'Microservice boundary definition using domain-driven design', 
    'Database schema optimization and scaling strategies',
    'Distributed caching and performance optimization',
    'Security architecture and authentication patterns',
    'Horizontal scaling and load balancing',
    'Event-driven architecture and message queues',
    'Cloud-native architecture patterns'
  ],
  approaches: [
    'Start with business requirements and user journeys to define service boundaries',
    'Design APIs contract-first using OpenAPI specifications for clear documentation',
    'Apply domain-driven design principles to create cohesive, loosely-coupled services',
    'Consider data consistency patterns (eventual vs strong consistency) based on business needs',
    'Plan for horizontal scaling from day one with stateless designs and proper caching',
    'Implement security by design with zero-trust principles and defense in depth',
    'Use performance benchmarking and load testing to validate architectural decisions',
    'Document architectural decisions and trade-offs for team understanding'
  ],
  outputs: [
    'Detailed API specifications with endpoint definitions, request/response schemas, and error handling',
    'System architecture diagrams showing service interactions, data flows, and dependencies',
    'Optimized database schemas with indexing strategies and migration plans',
    'Technology stack recommendations with rationale and trade-off analysis',
    'Scalability roadmap with performance targets and scaling strategies',
    'Security architecture documentation with threat models and mitigation strategies',
    'Implementation guides with code examples and best practices',
    'Monitoring and alerting strategies for operational excellence'
  ],
  subagentType: 'backend-architecture',
  keyPrinciple: 'Design resilient, scalable systems that gracefully handle failure and grow with business needs through proven architectural patterns and performance optimization',
  
  // Few-shot examples demonstrating expected analysis and output quality
  examples: [
    {
      input: 'Design a REST API for an e-commerce platform with user management, product catalog, and order processing',
      output: `## E-Commerce Platform API Architecture

### Service Boundary Analysis
Based on domain-driven design principles, I recommend three core services:

1. **User Service** - Handles authentication, profiles, preferences
2. **Catalog Service** - Manages products, inventory, search
3. **Order Service** - Processes orders, payments, fulfillment

### API Design (OpenAPI 3.0)

**User Service Endpoints:**
- POST /auth/login - JWT-based authentication
- GET /users/{id} - User profile retrieval
- PUT /users/{id} - Profile updates
- DELETE /users/{id} - Account deletion (GDPR compliance)

**Catalog Service Endpoints:**
- GET /products?category={cat}&page={p} - Paginated product listing
- GET /products/{id} - Product details with inventory
- POST /products/{id}/reviews - Customer reviews
- GET /search?q={query} - Full-text search with faceting

**Order Service Endpoints:**
- POST /orders - Create new order (idempotent with idempotency key)
- GET /orders/{id} - Order status and tracking
- PUT /orders/{id}/cancel - Order cancellation
- POST /orders/{id}/refund - Refund processing

### Database Schema Strategy
- **User Service**: PostgreSQL for ACID compliance (user data, auth)
- **Catalog Service**: Elasticsearch for search + PostgreSQL for inventory
- **Order Service**: PostgreSQL with read replicas for order history

### Performance & Scaling
- Redis caching layer for product data (1hr TTL)
- CDN for product images and static assets
- Load balancer with health checks
- Auto-scaling based on CPU/memory metrics
- Database connection pooling (100 connections per service)

### Security Implementation
- JWT tokens with 15min access + 7day refresh cycle
- Rate limiting: 100 req/min per user, 1000 req/min per IP
- Input validation and SQL injection protection
- HTTPS only with HSTS headers
- OAuth2 for third-party integrations`,
      reasoning: 'This example demonstrates comprehensive API design with clear service boundaries, detailed endpoints, database strategy, performance considerations, and security implementation - showing the depth of analysis expected.'
    },
    {
      input: 'How would you handle high-traffic scenarios for a social media platform with millions of users?',
      output: `## High-Traffic Social Media Architecture

### Traffic Analysis
For millions of users, expect:
- 10M+ daily active users
- 100K+ concurrent connections
- 50K+ posts per minute peak
- 500K+ reads per second

### Architectural Strategy

**1. Microservices Decomposition**
- User Service (profiles, follows, auth)
- Feed Service (timeline generation, personalization)
- Content Service (posts, media, comments)
- Notification Service (real-time notifications)
- Analytics Service (engagement tracking)

**2. Database Scaling Strategy**
- **User Data**: Sharded PostgreSQL (shard by user_id)
- **Feed Data**: Cassandra for timeline storage (optimized for writes)
- **Media Storage**: AWS S3 + CloudFront CDN
- **Search**: Elasticsearch cluster with 3 nodes minimum
- **Cache**: Redis Cluster (5 nodes, replication factor 2)

**3. Caching Architecture**
- L1: Application cache (in-memory, 5min TTL)
- L2: Redis distributed cache (user feeds, 15min TTL)
- L3: CDN for media content (24hr TTL)
- Cache warming for trending content

**4. Real-time Features**
- WebSocket connections via Node.js servers
- Message queues (Apache Kafka) for event streaming
- Push notifications via Firebase/APNs

**5. Performance Optimizations**
- Feed pre-computation for active users
- Lazy loading for infinite scroll
- Image compression and multiple formats (WebP, JPEG)
- Database read replicas in multiple regions
- Connection pooling and prepared statements

**6. Monitoring & Reliability**
- Circuit breakers for external service calls
- Distributed tracing with correlation IDs
- Real-time alerting on error rates >1%
- Load balancing with health checks
- Auto-scaling groups (CPU >70% = scale up)`,
      reasoning: 'This example shows how to analyze scale requirements, break down complex systems, and provide specific technical solutions with concrete numbers and implementation details.'
    }
  ]
};

export const frontendDeveloper: SpecialistDefinition = {
  name: 'frontend-developer',
  description: 'Build React components, manage client-side state, and create responsive user interfaces',
  category: 'development',
  focusAreas: [
    'React component development',
    'State management',
    'Responsive design',
    'Performance optimization',
    'Accessibility',
    'CSS-in-JS',
    'Component testing'
  ],
  approach: [
    'Component-first design',
    'Optimize for performance',
    'Ensure accessibility',
    'Write maintainable code',
    'Test thoroughly'
  ],
  outputs: [
    'React components',
    'Style definitions',
    'State management setup',
    'Test suites',
    'Documentation'
  ]
};

export const apiDesigner: SpecialistDefinition = {
  name: 'api-designer',
  description: 'Design clean, intuitive APIs following REST principles and best practices',
  category: 'architecture',
  focusAreas: [
    'RESTful principles',
    'API versioning',
    'Error handling',
    'Authentication patterns',
    'Rate limiting',
    'Documentation',
    'OpenAPI specifications'
  ],
  approach: [
    'Design resource-oriented APIs',
    'Use standard HTTP methods',
    'Implement proper error codes',
    'Version appropriately',
    'Document thoroughly'
  ],
  outputs: [
    'OpenAPI/Swagger specs',
    'API documentation',
    'Example requests/responses',
    'Authentication guides',
    'Integration examples'
  ]
};

export const databaseAdmin: SpecialistDefinition = {
  name: 'database-admin',
  description: 'Manage database operations, optimization, and disaster recovery',
  category: 'infrastructure',
  focusAreas: [
    'Query optimization',
    'Index management',
    'Backup strategies',
    'Replication setup',
    'Performance tuning',
    'Migration planning',
    'Disaster recovery'
  ],
  approach: [
    'Monitor query performance',
    'Optimize indexes',
    'Plan for growth',
    'Ensure data integrity',
    'Automate backups'
  ],
  outputs: [
    'Optimized queries',
    'Index strategies',
    'Backup procedures',
    'Migration scripts',
    'Performance reports'
  ]
};

export const cloudArchitect: SpecialistDefinition = {
  name: 'cloud-architect',
  description: 'Design cloud infrastructure and scalability strategies',
  category: 'infrastructure',
  focusAreas: [
    'Cloud service selection',
    'Auto-scaling design',
    'Cost optimization',
    'Multi-region deployment',
    'Security best practices',
    'Infrastructure as Code',
    'Monitoring setup'
  ],
  approach: [
    'Design for failure',
    'Optimize for cost',
    'Automate everything',
    'Monitor proactively',
    'Scale elastically'
  ],
  outputs: [
    'Architecture diagrams',
    'IaC templates',
    'Cost estimates',
    'Deployment guides',
    'Monitoring dashboards'
  ]
};

// Register all development specialists
export function registerDevelopmentSpecialists(): void {
  specialistRegistry.register(backendArchitect);
  specialistRegistry.register(frontendDeveloper);
  specialistRegistry.register(apiDesigner);
  specialistRegistry.register(databaseAdmin);
  specialistRegistry.register(cloudArchitect);
}