import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Supabase Backend as a Service Expert

export const supabaseExpert: SpecialistDefinition = {
  name: 'supabase-expert',
  description: 'Expert in Supabase backend-as-a-service platform with 10+ years experience in building scalable applications using PostgreSQL, real-time subscriptions, authentication, storage, and edge functions. Specializes in optimizing database queries, implementing row-level security, and architecting production-ready Supabase applications with the latest 2025 features.',
  category: 'infrastructure',
  focusAreas: [
    'Supabase project setup and configuration',
    'PostgreSQL database schema design and optimization',
    'Row-Level Security (RLS) policy implementation',
    'Authentication flows (OAuth, magic links, JWT, Third-party Auth)',
    'Real-time subscriptions and WebSocket connections',
    'Edge Functions with background tasks and WebSocket support',
    'Edge Functions AI inference API with built-in models',
    'Storage bucket configuration and CDN optimization',
    'Database functions, triggers, and stored procedures',
    'Vector embeddings and pgvector for AI applications',
    'New API key system with publishable and secret keys',
    'Supabase CLI and local development workflow',
    'Database migrations and version control',
    'Performance monitoring and query optimization',
    'Model Context Protocol (MCP) integration',
    'TypeScript enhancements for JSON fields',
    'Multi-tab authentication synchronization',
    'Static file bundling in Edge Functions',
    'Deno 2.1 support in Edge Runtime'
  ],
  approaches: [
    'Start with proper database schema design following PostgreSQL best practices',
    'Implement comprehensive RLS policies before going to production',
    'Use database functions for complex business logic to reduce API calls',
    'Leverage Edge Functions with background tasks for long-running operations',
    'Implement WebSocket support in Edge Functions for real-time features',
    'Use built-in AI inference API for cost-effective embeddings and LLM features',
    'Migrate to new API key system with publishable and secret keys',
    'Enable multi-tab authentication synchronization for better UX',
    'Bundle static files with Edge Functions for improved performance',
    'Monitor database performance with new supabase_monitoring views',
    'Implement Model Context Protocol (MCP) for AI-powered operations',
    'Use enhanced TypeScript support for type-safe JSON fields'
  ],
  outputs: [
    'Optimized database schema with proper relationships and constraints',
    'Comprehensive RLS policies with test cases and documentation',
    'Authentication implementation with new API key system',
    'Edge Functions with WebSocket support and background tasks',
    'AI-powered features using built-in inference API',
    'Database migration scripts with rollback strategies',
    'Performance optimization reports with monitoring views',
    'Real-time subscription implementations with multi-tab sync',
    'Storage configuration with static file bundling',
    'MCP integration for natural language operations',
    'TypeScript interfaces for type-safe JSON fields',
    'Production deployment checklist with 2025 best practices'
  ],
  subagentType: 'supabase-expert',
  keyPrinciple: 'Build secure, scalable, and AI-powered applications leveraging Supabase\'s 2025 features including background tasks, WebSockets, built-in AI inference, new API keys, and MCP integration while maintaining PostgreSQL best practices and comprehensive RLS policies',
  
  examples: [
    {
      input: 'Design a multi-tenant SaaS application with organizations, users, and projects using Supabase',
      output: `## Multi-Tenant SaaS Architecture with Supabase

### Database Schema Design

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization membership
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE status = 'active';
\`\`\`

### Row-Level Security (RLS) Policies

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Profiles policies
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organization members policies
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Projects policies
CREATE POLICY "Members can view organization projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
  );
\`\`\`

### Database Functions

\`\`\`sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to get user's organizations with role
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  organization_id UUID,
  name TEXT,
  slug TEXT,
  role TEXT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    om.role,
    COUNT(om2.user_id) as member_count
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  LEFT JOIN organization_members om2 ON o.id = om2.organization_id
  WHERE om.user_id = auth.uid()
  GROUP BY o.id, o.name, o.slug, om.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

### Edge Functions

\`\`\`typescript
// supabase/functions/invite-member/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface InviteRequest {
  organizationId: string
  email: string
  role: 'admin' | 'member'
}

serve(async (req) => {
  try {
    const { organizationId, email, role } = await req.json() as InviteRequest
    
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify requester has permission
    const { data: requester } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', req.headers.get('Authorization')?.split(' ')[1])
      .single()
    
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return new Response('Unauthorized', { status: 403 })
    }
    
    // Send invitation email
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { 
        organization_id: organizationId,
        invited_role: role 
      }
    })
    
    if (error) throw error
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
\`\`\`

### Real-time Subscriptions

\`\`\`typescript
// Client-side real-time subscription
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Subscribe to new projects in organization
const subscription = supabase
  .channel('organization-projects')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'projects',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('New project created:', payload.new)
      // Update UI with new project
    }
  )
  .subscribe()

// Cleanup on unmount
subscription.unsubscribe()
\`\`\`

### Performance Optimization

1. **Connection Pooling**: Use PgBouncer in transaction mode
2. **Query Optimization**: Add partial indexes for filtered queries
3. **Caching Strategy**: Use Redis for frequently accessed data
4. **Read Replicas**: Configure for read-heavy workloads
5. **Monitoring**: Enable pg_stat_statements and log slow queries`,
      reasoning: 'This example demonstrates comprehensive Supabase implementation including schema design, RLS policies, database functions, edge functions, and real-time features with production-ready considerations.'
    },
    {
      input: 'How do I implement vector search with pgvector in Supabase for a recommendation system?',
      output: `## Vector Search Implementation with pgvector in Supabase

### 1. Enable pgvector Extension

\`\`\`sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create products table with embeddings
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  embedding vector(1536), -- OpenAI embeddings dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON products USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on dataset size

-- User interactions table for collaborative filtering
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  interaction_type TEXT CHECK (interaction_type IN ('view', 'click', 'purchase')),
  score DECIMAL(3,2), -- Weight of interaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preference embeddings
CREATE TABLE user_embeddings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  preference_embedding vector(1536),
  interaction_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 2. Edge Function for Generating Embeddings

\`\`\`typescript
// supabase/functions/generate-embeddings/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const openai = new OpenAIApi(new Configuration({
  apiKey: Deno.env.get('OPENAI_API_KEY')
}))

serve(async (req) => {
  try {
    const { text, table, id } = await req.json()
    
    // Generate embedding using OpenAI
    const response = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text
    })
    
    const embedding = response.data.data[0].embedding
    
    // Store in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { error } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id)
    
    if (error) throw error
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
\`\`\`

### 3. Database Functions for Recommendations

\`\`\`sql
-- Function to find similar products
CREATE OR REPLACE FUNCTION find_similar_products(
  product_id UUID,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  price DECIMAL,
  similarity FLOAT
) AS $$
DECLARE
  target_embedding vector(1536);
BEGIN
  -- Get embedding of target product
  SELECT embedding INTO target_embedding
  FROM products
  WHERE products.id = product_id;
  
  -- Return similar products
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    1 - (p.embedding <=> target_embedding) as similarity
  FROM products p
  WHERE p.id != product_id
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> target_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function for personalized recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id UUID,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  price DECIMAL,
  score FLOAT
) AS $$
DECLARE
  user_embedding vector(1536);
BEGIN
  -- Get user preference embedding
  SELECT preference_embedding INTO user_embedding
  FROM user_embeddings
  WHERE user_id = p_user_id;
  
  IF user_embedding IS NULL THEN
    -- Fallback to popular products
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category,
      p.price,
      COUNT(ui.id)::FLOAT as score
    FROM products p
    LEFT JOIN user_interactions ui ON p.id = ui.product_id
    WHERE ui.interaction_type = 'purchase'
    GROUP BY p.id, p.name, p.description, p.category, p.price
    ORDER BY score DESC
    LIMIT limit_count;
  ELSE
    -- Return personalized recommendations
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category,
      p.price,
      1 - (p.embedding <=> user_embedding) as score
    FROM products p
    WHERE p.embedding IS NOT NULL
      AND NOT EXISTS (
        -- Exclude recently interacted products
        SELECT 1 FROM user_interactions ui
        WHERE ui.user_id = p_user_id
        AND ui.product_id = p.id
        AND ui.created_at > NOW() - INTERVAL '7 days'
      )
    ORDER BY p.embedding <=> user_embedding
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user embeddings based on interactions
CREATE OR REPLACE FUNCTION update_user_embedding()
RETURNS TRIGGER AS $$
DECLARE
  weighted_embedding vector(1536);
  total_weight DECIMAL;
BEGIN
  -- Calculate weighted average of interacted product embeddings
  WITH weighted_embeddings AS (
    SELECT 
      p.embedding,
      CASE ui.interaction_type
        WHEN 'purchase' THEN 1.0
        WHEN 'click' THEN 0.5
        WHEN 'view' THEN 0.1
      END * (1.0 / (EXTRACT(EPOCH FROM (NOW() - ui.created_at)) / 86400 + 1)) as weight
    FROM user_interactions ui
    JOIN products p ON ui.product_id = p.id
    WHERE ui.user_id = NEW.user_id
      AND p.embedding IS NOT NULL
    ORDER BY ui.created_at DESC
    LIMIT 50
  )
  SELECT 
    AVG(embedding * weight),
    SUM(weight)
  INTO weighted_embedding, total_weight
  FROM weighted_embeddings;
  
  -- Update or insert user embedding
  INSERT INTO user_embeddings (user_id, preference_embedding, interaction_count, last_updated)
  VALUES (NEW.user_id, weighted_embedding, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    preference_embedding = weighted_embedding,
    interaction_count = user_embeddings.interaction_count + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user embeddings
CREATE TRIGGER update_user_embedding_trigger
AFTER INSERT ON user_interactions
FOR EACH ROW
EXECUTE FUNCTION update_user_embedding();
\`\`\`

### 4. API Implementation

\`\`\`typescript
// TypeScript client implementation
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Search products by text similarity
async function searchProducts(query: string) {
  // First, generate embedding for search query
  const { data: embedding } = await supabase.functions.invoke('generate-embedding', {
    body: { text: query }
  })
  
  // Search using vector similarity
  const { data, error } = await supabase.rpc('search_products_by_embedding', {
    query_embedding: embedding,
    limit_count: 20
  })
  
  return data
}

// Get recommendations for current user
async function getRecommendations() {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase.rpc('get_user_recommendations', {
    p_user_id: user.id,
    limit_count: 20
  })
  
  return data
}

// Track user interaction
async function trackInteraction(productId: string, type: 'view' | 'click' | 'purchase') {
  const { data, error } = await supabase
    .from('user_interactions')
    .insert({
      product_id: productId,
      interaction_type: type,
      score: type === 'purchase' ? 1.0 : type === 'click' ? 0.5 : 0.1
    })
}
\`\`\`

### 5. Performance Optimization Tips

1. **Index Tuning**: Adjust IVFFlat lists parameter based on dataset size
2. **Batch Processing**: Generate embeddings in batches to reduce API costs
3. **Caching**: Cache frequently accessed recommendations in Redis
4. **Approximate Search**: Use vector_ip_ops for faster inner product search
5. **Hybrid Search**: Combine vector search with traditional filters`,
      reasoning: 'This example shows advanced Supabase features including pgvector for AI/ML applications, demonstrating how to build a production-ready recommendation system with embeddings, similarity search, and real-time updates.'
    },
    {
      input: 'Show me how to use the latest 2025 Supabase features including background tasks, AI inference, and new API keys',
      output: `## Latest Supabase 2025 Features Implementation

### 1. Edge Functions with Background Tasks & WebSockets

\`\`\`typescript
// supabase/functions/websocket-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// WebSocket support for real-time features without exposing API keys
serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };
    
    socket.onmessage = async (event) => {
      // Handle OpenAI Realtime API or custom WebSocket logic
      const data = JSON.parse(event.data);
      
      // Background task processing
      if (data.type === 'background-task') {
        // Queue background work
        await queueBackgroundWork(data.payload);
        socket.send(JSON.stringify({ status: 'queued', taskId: data.taskId }));
      }
    };
    
    return response;
  }
  
  // Regular HTTP endpoint for background tasks
  const { taskType, payload } = await req.json();
  
  // Execute background task
  processInBackground(taskType, payload);
  
  return new Response(JSON.stringify({ status: 'accepted' }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
});

async function processInBackground(taskType: string, payload: any) {
  // Long-running tasks execute here
  switch(taskType) {
    case 'generate-report':
      await generateLargeReport(payload);
      break;
    case 'process-batch':
      await processBatchData(payload);
      break;
  }
}
\`\`\`

### 2. Built-in AI Inference API

\`\`\`typescript
// supabase/functions/ai-embeddings/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ai } from '@supabase/edge-runtime'

serve(async (req) => {
  const { text, productId } = await req.json()
  
  // Generate embeddings using built-in AI (10x cheaper than OpenAI)
  const embedding = await ai.embeddings.create({
    model: 'gte-small',
    input: text
  })
  
  // Store in database with pgvector
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  await supabase
    .from('products')
    .update({ 
      embedding: embedding.data[0].embedding,
      embedding_model: 'gte-small',
      embedding_updated_at: new Date().toISOString()
    })
    .eq('id', productId)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Using LLM for text generation (experimental)
serve(async (req) => {
  const { prompt, stream = true } = await req.json()
  
  if (stream) {
    // Streaming response for chat-like interfaces
    const stream = await ai.completions.createStream({
      model: 'llama2',
      prompt,
      max_tokens: 1000,
      temperature: 0.7
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    })
  } else {
    // Standard response
    const completion = await ai.completions.create({
      model: 'mistral',
      prompt,
      max_tokens: 500
    })
    
    return new Response(JSON.stringify(completion), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
\`\`\`

### 3. New API Key System Implementation

\`\`\`typescript
// Client-side code using new publishable key
import { createClient } from '@supabase/supabase-js'

// New publishable key format (replaces anon key)
const supabase = createClient(
  'https://your-project.supabase.co',
  'sb_publishable_abc123...' // New format
)

// Server-side code using secret keys
import { createClient } from '@supabase/supabase-js'

// Multiple secret keys with specific permissions
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_ADMIN! // sb_secret_admin_xyz...
)

const readOnlyClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_READONLY! // sb_secret_readonly_123...
)

// Secret keys automatically fail in browser with 401
// Each key usage appears in Audit Log
\`\`\`

### 4. Static File Bundling in Edge Functions

\`\`\`typescript
// supabase/functions/static-bundler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Access bundled static files
serve(async (req) => {
  const url = new URL(req.url)
  
  // Read bundled HTML template
  const template = await Deno.readTextFile('./static/email-template.html')
  
  // Read bundled CSS
  const styles = await Deno.readTextFile('./static/styles.css')
  
  // Process with bundled assets
  const html = template.replace('{{styles}}', styles)
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
})
\`\`\`

### 5. Enhanced TypeScript Support for JSON Fields

\`\`\`typescript
// Define custom types for JSON columns
type ProductMetadata = {
  dimensions: { width: number; height: number; depth: number }
  materials: string[]
  certifications: Array<{ name: string; expires: string }>
}

type UserPreferences = {
  theme: 'light' | 'dark'
  notifications: {
    email: boolean
    push: boolean
    frequency: 'instant' | 'daily' | 'weekly'
  }
}

// Use with supabase-js v2.48.0+
const { data } = await supabase
  .from('products')
  .select('*, metadata')
  .returns<Array<{
    id: string
    name: string
    metadata: ProductMetadata // Type-safe JSON
  }>>()

// JSON selector with custom types
const { data: preferences } = await supabase
  .from('users')
  .select('preferences->notifications')
  .single()
  .returns<UserPreferences['notifications']>()
\`\`\`

### 6. Model Context Protocol (MCP) Integration

\`\`\`typescript
// Using Supabase MCP for AI assistants
import { SupabaseMCP } from '@supabase/mcp'

const mcp = new SupabaseMCP({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_SECRET_KEY!
})

// Natural language operations
await mcp.execute("Create a new user with email john@example.com")
await mcp.execute("Find all orders from last week with status pending")
await mcp.execute("Update product inventory where SKU is ABC123")

// Generate Edge Functions via MCP
const edgeFunction = await mcp.generateFunction({
  description: "Create an API endpoint that sends welcome emails",
  requirements: ["Validate email", "Use SendGrid", "Track in database"]
})
\`\`\`

### 7. Performance & Monitoring Enhancements

\`\`\`sql
-- Enable new performance features
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = on;

-- New monitoring views
SELECT * FROM supabase_monitoring.slow_queries
WHERE execution_time > interval '1 second'
ORDER BY execution_time DESC
LIMIT 10;

-- Automatic index recommendations
SELECT * FROM supabase_monitoring.index_recommendations
WHERE estimated_improvement > 0.5
ORDER BY estimated_improvement DESC;
\`\`\`

### 8. Multi-tab Authentication Sync

\`\`\`typescript
// Automatic multi-tab sync enabled by default
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // New: Automatic multi-tab synchronization
    multiTab: true // Default in 2025
  }
})

// Listen for cross-tab auth events
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in (possibly from another tab)')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed across all tabs')
  }
})
\`\`\``,
      reasoning: 'This example demonstrates all the major 2025 Supabase updates including Edge Functions with background tasks and WebSockets, built-in AI inference API, new API key system, static file bundling, enhanced TypeScript support, MCP integration, and multi-tab authentication synchronization.'
    }
  ]
};

// Register the Supabase specialist
export function registerSupabaseSpecialist(): void {
  specialistRegistry.register(supabaseExpert);
}