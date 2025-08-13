import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Development & Architecture Specialists

export const backendArchitect: SpecialistDefinition = {
  name: 'backend-architect',
  description: 'Expert backend system architect with 15+ years experience designing scalable APIs, microservices, and database systems. Specializes in high-performance, security-first architectures leveraging 2024-2025 patterns including serverless, edge computing, and AI integration.',
  category: 'architecture',
  focusAreas: [
    'RESTful and GraphQL API design with OpenAPI/AsyncAPI specifications',
    'Microservice boundary definition using domain-driven design', 
    'Serverless architecture with containers (AWS Fargate, Cloud Run)',
    'Edge computing integration with lightweight Kubernetes (k3s, MicroK8s)',
    'Event-driven architecture with Apache Kafka and cloud event buses',
    'Backend for Frontend (BFF) pattern implementation',
    'Service mesh architecture (Istio, Linkerd) for microservices',
    'AI-integrated architecture with specialized ML microservices',
    'Headless and composable architecture patterns',
    'Real-time architecture leveraging 5G capabilities',
    'Database schema optimization and multi-model strategies',
    'CQRS and Event Sourcing patterns'
  ],
  approaches: [
    'Start with business requirements and user journeys to define service boundaries',
    'Design APIs contract-first using OpenAPI/AsyncAPI specifications',
    'Implement fine-grained microservices with increased autonomy',
    'Leverage serverless containers for cost-efficient, infrequent workloads',
    'Deploy edge computing for real-time processing and reduced latency',
    'Use event-driven patterns for complex, distributed workflows',
    'Apply Backend for Frontend (BFF) pattern for tailored client experiences',
    'Integrate service mesh for enhanced security and observability',
    'Implement AI microservices for specialized ML model deployment',
    'Adopt headless architecture for multi-channel flexibility',
    'Document architectural decisions using ADRs (Architecture Decision Records)'
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
    },
    {
      input: 'Design a modern backend architecture using 2024-2025 patterns for an AI-powered e-commerce platform',
      output: `## AI-Powered E-Commerce Platform Architecture (2024-2025)

### Architecture Overview
Using modern patterns: Serverless containers, edge computing, event-driven, and AI microservices.

### 1. Core Microservices Architecture

**Service Decomposition (Fine-Grained):**
- **User Service**: Authentication, profiles, preferences
- **Product Catalog**: Inventory, search, recommendations
- **AI Recommendation Engine**: Multiple specialized models
  - Intent classification model (small, edge-deployed)
  - Product embedding model (medium, serverless)
  - Personalization model (large, GPU-enabled)
- **Order Processing**: Cart, checkout, payments
- **Fulfillment Service**: Shipping, tracking, returns

### 2. Serverless Container Strategy

\`\`\`yaml
# AWS Fargate / Cloud Run Configuration
services:
  recommendation-engine:
    type: serverless-container
    scaling:
      min_instances: 0  # Scale to zero
      max_instances: 100
      target_cpu: 70%
    pricing: per-request  # Cost-efficient for sporadic use
  
  product-search:
    type: serverless-container
    memory: 2GB
    cpu: 1vCPU
    cold_start_optimization: true
\`\`\`

### 3. Edge Computing Integration

**Edge Locations (k3s clusters):**
- **Intent Classification**: Deploy lightweight models at edge
- **Cache Layer**: Product data, user sessions
- **API Gateway**: Request routing, rate limiting

\`\`\`typescript
// Edge Function Example
export async function onRequest(request: Request): Promise<Response> {
  const intent = await classifyIntent(request);
  
  if (intent.type === 'product-search') {
    // Handle at edge with cached data
    return handleEdgeSearch(request);
  }
  
  // Route to origin for complex operations
  return fetch(origin, request);
}
\`\`\`

### 4. Event-Driven Architecture

**Event Bus (Apache Kafka / AWS EventBridge):**
\`\`\`
Events:
├── user.registered
├── product.viewed
├── cart.updated
├── order.placed
├── payment.processed
├── recommendation.generated
└── inventory.updated
\`\`\`

**Event Flow Example:**
1. User views product → Event published
2. AI service consumes event → Updates user profile
3. Recommendation service triggered → Generates personalized suggestions
4. Cache invalidated → Edge nodes updated

### 5. Backend for Frontend (BFF) Pattern

\`\`\`typescript
// Mobile BFF (Optimized for bandwidth)
class MobileBFF {
  async getProductList(params: ListParams) {
    const products = await productService.list(params);
    return this.compressForMobile(products);
  }
  
  private compressForMobile(data: Product[]) {
    return data.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      thumbnail: p.images.thumbnail // Single small image
    }));
  }
}

// Desktop BFF (Rich experience)
class DesktopBFF {
  async getProductList(params: ListParams) {
    const [products, recommendations, reviews] = await Promise.all([
      productService.list(params),
      recommendationService.getFor(params),
      reviewService.getPopular(params)
    ]);
    
    return this.enrichForDesktop(products, recommendations, reviews);
  }
}
\`\`\`

### 6. Service Mesh Implementation (Istio)

\`\`\`yaml
# Service mesh configuration
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: recommendation-service
spec:
  http:
  - match:
    - headers:
        x-user-segment:
          exact: premium
    route:
    - destination:
        host: recommendation-v2  # Advanced AI model
  - route:
    - destination:
        host: recommendation-v1  # Standard model
\`\`\`

### 7. AI Microservices Architecture

\`\`\`python
# Specialized AI Services
class RecommendationOrchestrator:
    def __init__(self):
        self.intent_classifier = EdgeDeployedModel()
        self.product_embedder = ServerlessModel()
        self.personalization = GPUEnabledModel()
    
    async def get_recommendations(self, user_id: str, context: dict):
        # Parallel model execution
        intent, embeddings, user_profile = await asyncio.gather(
            self.intent_classifier.predict(context),
            self.product_embedder.generate_embeddings(context),
            self.personalization.get_user_preferences(user_id)
        )
        
        # Combine results
        return self.merge_recommendations(intent, embeddings, user_profile)
\`\`\`

### 8. Real-time Features with 5G

**WebSocket Architecture:**
- Live inventory updates
- Real-time pricing adjustments
- Instant checkout notifications
- AR/VR product previews (5G-enabled)

### 9. Monitoring & Observability

\`\`\`yaml
# Distributed tracing setup
tracing:
  provider: jaeger
  sampling_rate: 0.1
  
metrics:
  provider: prometheus
  endpoints:
    - /metrics
    - /custom-metrics
    
logging:
  aggregator: elasticsearch
  retention: 30d
\`\`\`

### 10. Cost Optimization

- **Serverless for sporadic workloads**: Save 70% on AI inference
- **Edge caching**: Reduce origin requests by 80%
- **Event-driven scaling**: Scale only active services
- **Multi-tier storage**: Hot/warm/cold data strategies`,
      reasoning: 'This example demonstrates cutting-edge 2024-2025 backend architecture patterns including serverless containers, edge computing, AI microservices, event-driven design, BFF pattern, service mesh, and 5G capabilities with practical implementation details.'
    }
  ]
};

export const frontendDeveloper: SpecialistDefinition = {
  name: 'frontend-developer',
  description: 'Expert React developer specializing in React 19, Server Components, Next.js 15, and modern frontend patterns. Proficient in building high-performance applications with the latest hooks, concurrent features, and full-stack React capabilities.',
  category: 'development',
  focusAreas: [
    'React 19 with Server Components (RSC)',
    'Next.js 15 App Router architecture',
    'React Actions and form handling',
    'New React 19 hooks (use, useActionState, useFormStatus, useOptimistic)',
    'Concurrent features and Suspense boundaries',
    'Client and Server Component patterns',
    'TypeScript with modern React patterns',
    'Performance optimization with React Compiler',
    'Accessibility with ARIA and semantic HTML',
    'CSS-in-JS and Tailwind CSS',
    'Testing with React Testing Library',
    'Real-time features with WebSockets',
    'Progressive enhancement strategies'
  ],
  approach: [
    'Start with Server Components for better performance',
    'Use Actions for form handling and data mutations',
    'Implement optimistic updates with useOptimistic',
    'Apply proper Client/Server Component boundaries',
    'Leverage Suspense for loading states',
    'Use the new use() hook for promise handling',
    'Optimize bundle size with dynamic imports',
    'Ensure accessibility from the start',
    'Write comprehensive tests for all components',
    'Monitor Core Web Vitals and performance'
  ],
  outputs: [
    'React 19 Server and Client Components',
    'Next.js 15 App Router implementations',
    'Type-safe component libraries',
    'Form handling with Actions',
    'Optimistic UI implementations',
    'Suspense and error boundaries',
    'Performance monitoring dashboards',
    'Accessibility audit reports',
    'Component documentation with Storybook',
    'End-to-end test suites'
  ],
  subagentType: 'frontend-developer',
  keyPrinciple: 'Build performant, accessible React applications leveraging React 19 Server Components, Actions, and modern patterns for exceptional user experiences',
  examples: [
    {
      input: 'Create a modern e-commerce product page using React 19 Server Components and Actions',
      output: `## React 19 E-Commerce Product Page

### Project Structure (Next.js 15)
\`\`\`
app/
├── products/
│   ├── [id]/
│   │   ├── page.tsx          # Server Component
│   │   ├── loading.tsx       # Loading UI
│   │   └── error.tsx         # Error boundary
│   ├── _components/
│   │   ├── ProductDetails.tsx    # Server Component
│   │   ├── ProductGallery.tsx    # Client Component
│   │   ├── AddToCartButton.tsx   # Client Component with Actions
│   │   └── ReviewsList.tsx       # Server Component
│   └── actions.ts            # Server Actions
├── layout.tsx
└── globals.css
\`\`\`

### Server Component - Product Page (app/products/[id]/page.tsx)
\`\`\`tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetails } from '../_components/ProductDetails';
import { ProductGallery } from '../_components/ProductGallery';
import { ReviewsList } from '../_components/ReviewsList';
import { getProduct } from '@/lib/api';

// This is a Server Component - runs on the server
export default async function ProductPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Fetch data on the server
  const product = await getProduct(params.id);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Client Component for interactivity */}
        <ProductGallery images={product.images} />
        
        {/* Server Component with product data */}
        <ProductDetails product={product} />
      </div>
      
      {/* Suspense for streaming */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsList productId={product.id} />
      </Suspense>
    </div>
  );
}

// Loading skeleton
function ReviewsSkeleton() {
  return (
    <div className="mt-12 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
\`\`\`

### Server Actions (app/products/actions.ts)
\`\`\`tsx
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// Schema validation
const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).max(99),
  variantId: z.string().optional(),
});

export async function addToCart(
  prevState: any,
  formData: FormData
) {
  // Get authenticated user
  const session = await auth();
  if (!session?.user) {
    return {
      error: 'Please sign in to add items to cart',
    };
  }
  
  // Validate input
  const validatedFields = addToCartSchema.safeParse({
    productId: formData.get('productId'),
    quantity: Number(formData.get('quantity')),
    variantId: formData.get('variantId'),
  });
  
  if (!validatedFields.success) {
    return {
      error: 'Invalid product data',
    };
  }
  
  try {
    // Add to cart in database
    await db.cartItem.create({
      data: {
        userId: session.user.id,
        ...validatedFields.data,
      },
    });
    
    // Revalidate cart data
    revalidatePath('/cart');
    
    return {
      success: true,
      message: 'Added to cart!',
    };
  } catch (error) {
    return {
      error: 'Failed to add to cart. Please try again.',
    };
  }
}

export async function submitReview(
  productId: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Please sign in to leave a review' };
  }
  
  const rating = Number(formData.get('rating'));
  const comment = formData.get('comment') as string;
  
  if (rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5' };
  }
  
  try {
    await db.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment,
      },
    });
    
    // Revalidate product page
    revalidatePath(\`/products/\${productId}\`);
    
    return { success: true };
  } catch (error) {
    return { error: 'Failed to submit review' };
  }
}
\`\`\`

### Client Component with Actions (app/products/_components/AddToCartButton.tsx)
\`\`\`tsx
'use client';

import { useActionState, useOptimistic, startTransition } from 'react';
import { addToCart } from '../actions';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  selectedVariant?: string;
}

export function AddToCartButton({ 
  productId, 
  productName,
  selectedVariant 
}: AddToCartButtonProps) {
  // New useActionState hook for form handling
  const [state, formAction, isPending] = useActionState(
    addToCart,
    { error: null, success: false }
  );
  
  // Optimistic state for cart count
  const [optimisticCartCount, addOptimistic] = useOptimistic(
    0, // Initial cart count
    (state, newItem) => state + 1
  );
  
  const handleSubmit = (formData: FormData) => {
    // Optimistically update UI
    startTransition(() => {
      addOptimistic(1);
    });
    
    // Submit form
    formAction(formData);
  };
  
  return (
    <form action={handleSubmit} className="mt-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedVariant} />
      
      <div className="flex items-center gap-4">
        <input
          type="number"
          name="quantity"
          defaultValue="1"
          min="1"
          max="99"
          className="w-20 px-3 py-2 border rounded-md"
          disabled={isPending}
        />
        
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          {isPending ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
      
      {/* Show success/error messages */}
      {state.success && (
        <p className="mt-2 text-green-600">
          {productName} added to cart!
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
\`\`\`

### Client Component - Product Gallery
\`\`\`tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };
  
  return (
    <div className="relative">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt}
          width={600}
          height={600}
          className="object-cover w-full h-full"
          priority
        />
      </div>
      
      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* Thumbnails */}
      <div className="mt-4 flex gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setCurrentIndex(index)}
            className={\`relative w-20 h-20 rounded-md overflow-hidden \${
              index === currentIndex ? 'ring-2 ring-blue-600' : ''
            }\`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
\`\`\`

### Server Component with Suspense
\`\`\`tsx
import { use } from 'react';
import { getReviews } from '@/lib/api';
import { ReviewForm } from './ReviewForm';

interface ReviewsListProps {
  productId: string;
}

// Using the new 'use' hook with promises
export function ReviewsList({ productId }: ReviewsListProps) {
  // The 'use' hook can consume promises in Server Components
  const reviews = use(getReviews(productId));
  
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      
      {/* Client Component for form */}
      <ReviewForm productId={productId} />
      
      {/* Server-rendered reviews */}
      <div className="mt-8 space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < review.rating ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                by {review.author} on {review.date}
              </span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
\`\`\`

### Form Status Hook Example
\`\`\`tsx
'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  // Must be used inside a form
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      {pending ? 'Submitting...' : 'Submit Review'}
    </button>
  );
}
\`\`\``,
      reasoning: 'This example demonstrates React 19 features including Server Components, Server Actions, the new use() hook, useActionState, useOptimistic, and proper Client/Server Component patterns with Next.js 15, showing real-world e-commerce implementation.'
    }
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