import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Language Specialists

export const pythonPro: SpecialistDefinition = {
  name: 'python-pro',
  description: 'Expert Python developer specializing in modern Python 3.12+ features, advanced type systems, async/await patterns, and high-performance computing. Proficient in FastAPI, Django, data science libraries, and cutting-edge Python ecosystem tools for 2024-2025.',
  category: 'language',
  focusAreas: [
    'Python 3.12+ features (PEP 695 type parameters, PEP 701 f-string syntax)',
    'Advanced type hints with TypeVar, Protocol, and TypedDict',
    'Async/await with asyncio, trio, and anyio',
    'Modern package management with uv, Poetry, and PDM',
    'Testing with pytest, hypothesis, and property-based testing',
    'Performance optimization with Cython, Numba, and mypyc',
    'Data structures and algorithms optimization',
    'FastAPI for high-performance APIs with Pydantic v2',
    'Django 5.0+ with async views and type safety',
    'Scientific computing with NumPy, Pandas, Polars',
    'Machine learning with scikit-learn, PyTorch, JAX',
    'Code quality with Ruff, Black, and pre-commit hooks',
    'Memory profiling and optimization techniques',
    'Structural pattern matching (match/case)',
    'Dataclasses and attrs for clean data modeling'
  ],
  approach: [
    'Follow PEP 8, PEP 484, and latest Python Enhancement Proposals',
    'Use type hints extensively with mypy strict mode',
    'Leverage modern Python features for cleaner code',
    'Write property-based tests with hypothesis',
    'Optimize for both readability and performance',
    'Use async/await for I/O-bound operations',
    'Apply functional programming patterns where appropriate',
    'Profile before optimizing with cProfile and memory_profiler',
    'Use context managers and descriptors effectively',
    'Implement protocols for better abstraction'
  ],
  outputs: [
    'Type-safe Python modules with full annotations',
    'Comprehensive test suites with 95%+ coverage',
    'Stub files (.pyi) for type checking',
    'Sphinx/MkDocs documentation with examples',
    'Performance benchmarks and profiling reports',
    'Poetry/uv project configurations',
    'CI/CD pipelines with GitHub Actions',
    'Docker containers with multi-stage builds',
    'Pre-commit hooks for code quality',
    'API documentation with OpenAPI/Swagger'
  ],
  keyPrinciple: 'Zen of Python meets modern performance: Beautiful, explicit, and blazingly fast code leveraging Python 3.12+ features',
  examples: [
    {
      input: 'Create a high-performance async web scraper with rate limiting and error handling',
      output: `## High-Performance Async Web Scraper (Python 3.12+)

### Project Structure
\`\`\`
async-scraper/
├── pyproject.toml
├── src/
│   └── scraper/
│       ├── __init__.py
│       ├── core.py
│       ├── rate_limiter.py
│       ├── parsers.py
│       └── models.py
├── tests/
│   ├── test_core.py
│   └── test_rate_limiter.py
└── README.md
\`\`\`

### Modern Project Configuration (pyproject.toml)
\`\`\`toml
[project]
name = "async-scraper"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.26",
    "beautifulsoup4>=4.12",
    "pydantic>=2.5",
    "tenacity>=8.2",
    "structlog>=24.1",
    "redis>=5.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4",
    "pytest-asyncio>=0.23",
    "hypothesis>=6.92",
    "mypy>=1.8",
    "ruff>=0.1.9",
    "black>=23.12",
]

[tool.ruff]
line-length = 88
target-version = "py312"
select = ["E", "F", "UP", "B", "SIM", "I"]

[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
\`\`\`

### Type-Safe Models (src/scraper/models.py)
\`\`\`python
from typing import TypeAlias, Protocol, TypeVar
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field, ConfigDict

# Type aliases for clarity
HTML: TypeAlias = str
T = TypeVar('T', bound=BaseModel)

class ScrapedData(BaseModel):
    """Base model for scraped data with automatic validation."""
    model_config = ConfigDict(frozen=True)
    
    url: HttpUrl
    title: str
    content: str
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, str | int | float] = Field(default_factory=dict)

class Parser[T](Protocol):
    """Protocol for content parsers using PEP 695 syntax."""
    async def parse(self, html: HTML, url: str) -> T:
        ...

class RateLimitConfig(BaseModel):
    """Configuration for rate limiting."""
    requests_per_second: float = 10.0
    burst_size: int = 20
    retry_after: float = 1.0
    use_redis: bool = True
    redis_url: str = "redis://localhost:6379"
\`\`\`

### Advanced Rate Limiter (src/scraper/rate_limiter.py)
\`\`\`python
import asyncio
import time
from typing import Optional
from contextlib import asynccontextmanager
import redis.asyncio as redis
import structlog

logger = structlog.get_logger()

class DistributedRateLimiter:
    """Token bucket rate limiter with Redis backend for distributed systems."""
    
    def __init__(self, config: RateLimitConfig) -> None:
        self.config = config
        self.tokens = config.burst_size
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()
        self._redis: Optional[redis.Redis] = None
    
    async def __aenter__(self) -> "DistributedRateLimiter":
        if self.config.use_redis:
            self._redis = await redis.from_url(self.config.redis_url)
        return self
    
    async def __aexit__(self, *args) -> None:
        if self._redis:
            await self._redis.close()
    
    @asynccontextmanager
    async def acquire(self, domain: str):
        """Acquire permission to make a request."""
        if self._redis:
            await self._acquire_distributed(domain)
        else:
            await self._acquire_local()
        
        try:
            yield
        finally:
            logger.debug("request_completed", domain=domain)
    
    async def _acquire_distributed(self, domain: str) -> None:
        """Distributed rate limiting using Redis."""
        key = f"rate_limit:{domain}"
        
        while True:
            pipe = self._redis.pipeline()
            current_time = time.time()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, current_time - 1)
            # Count current requests
            pipe.zcard(key)
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            # Set expiry
            pipe.expire(key, 2)
            
            results = await pipe.execute()
            request_count = results[1]
            
            if request_count < self.config.requests_per_second:
                break
            
            await asyncio.sleep(self.config.retry_after)
    
    async def _acquire_local(self) -> None:
        """Local rate limiting for single instance."""
        async with self._lock:
            current = time.monotonic()
            time_passed = current - self.last_update
            self.tokens = min(
                self.config.burst_size,
                self.tokens + time_passed * self.config.requests_per_second
            )
            self.last_update = current
            
            if self.tokens < 1:
                sleep_time = (1 - self.tokens) / self.config.requests_per_second
                await asyncio.sleep(sleep_time)
                self.tokens = 1
            
            self.tokens -= 1
\`\`\`

### Core Scraper with Error Handling (src/scraper/core.py)
\`\`\`python
import asyncio
from typing import AsyncIterator, TypeVar, Generic
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import structlog
from bs4 import BeautifulSoup

from .models import ScrapedData, Parser, RateLimitConfig, HTML
from .rate_limiter import DistributedRateLimiter

logger = structlog.get_logger()

T = TypeVar('T', bound=ScrapedData)

class AsyncScraper(Generic[T]):
    """High-performance async web scraper with rate limiting."""
    
    def __init__(
        self,
        parser: Parser[T],
        rate_limit_config: Optional[RateLimitConfig] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        self.parser = parser
        self.rate_limit_config = rate_limit_config or RateLimitConfig()
        self.timeout = timeout
        self.max_retries = max_retries
        self._session: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self) -> "AsyncScraper[T]":
        self._session = httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True,
            headers={
                "User-Agent": "AsyncScraper/1.0 (+https://example.com/bot)"
            },
        )
        self._rate_limiter = await DistributedRateLimiter(
            self.rate_limit_config
        ).__aenter__()
        return self
    
    async def __aexit__(self, *args) -> None:
        if self._session:
            await self._session.aclose()
        await self._rate_limiter.__aexit__(*args)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, asyncio.TimeoutError)),
    )
    async def fetch(self, url: str) -> HTML:
        """Fetch HTML content with retry logic."""
        domain = httpx.URL(url).host
        
        async with self._rate_limiter.acquire(domain):
            logger.info("fetching_url", url=url)
            response = await self._session.get(url)
            response.raise_for_status()
            return response.text
    
    async def scrape(self, url: str) -> T:
        """Scrape a single URL."""
        try:
            html = await self.fetch(url)
            result = await self.parser.parse(html, url)
            logger.info("scrape_success", url=url)
            return result
        except Exception as e:
            logger.error("scrape_failed", url=url, error=str(e))
            raise
    
    async def scrape_many(
        self,
        urls: list[str],
        max_concurrent: int = 10,
    ) -> AsyncIterator[T | Exception]:
        """Scrape multiple URLs concurrently."""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def scrape_with_semaphore(url: str) -> T | Exception:
            async with semaphore:
                try:
                    return await self.scrape(url)
                except Exception as e:
                    return e
        
        tasks = [scrape_with_semaphore(url) for url in urls]
        
        for coro in asyncio.as_completed(tasks):
            result = await coro
            yield result
\`\`\`

### Example Parser Implementation (src/scraper/parsers.py)
\`\`\`python
from bs4 import BeautifulSoup
from .models import ScrapedData, HTML

class ArticleParser:
    """Parser for article content."""
    
    async def parse(self, html: HTML, url: str) -> ScrapedData:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract title
        title_tag = soup.find('h1') or soup.find('title')
        title = title_tag.text.strip() if title_tag else "No title"
        
        # Extract main content
        content_tags = soup.find_all(['p', 'article'])
        content = ' '.join(tag.text.strip() for tag in content_tags)
        
        # Extract metadata
        metadata = {
            "word_count": len(content.split()),
            "images": len(soup.find_all('img')),
            "links": len(soup.find_all('a', href=True)),
        }
        
        return ScrapedData(
            url=url,
            title=title,
            content=content[:1000],  # Truncate for example
            metadata=metadata,
        )
\`\`\`

### Usage Example with Async Context Manager
\`\`\`python
import asyncio
from scraper.core import AsyncScraper
from scraper.parsers import ArticleParser
from scraper.models import RateLimitConfig

async def main():
    urls = [
        "https://example.com/article1",
        "https://example.com/article2",
        "https://example.com/article3",
    ]
    
    config = RateLimitConfig(
        requests_per_second=5.0,
        burst_size=10,
        use_redis=True,
    )
    
    parser = ArticleParser()
    
    async with AsyncScraper(parser, config) as scraper:
        # Scrape single URL
        result = await scraper.scrape(urls[0])
        print(f"Title: {result.title}")
        
        # Scrape multiple URLs concurrently
        async for result in scraper.scrape_many(urls):
            match result:
                case ScrapedData() as data:
                    print(f"✓ {data.url}: {data.title}")
                case Exception() as error:
                    print(f"✗ Failed: {error}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

### Property-Based Testing (tests/test_rate_limiter.py)
\`\`\`python
import pytest
import hypothesis
from hypothesis import strategies as st
import asyncio
from scraper.rate_limiter import DistributedRateLimiter
from scraper.models import RateLimitConfig

@hypothesis.given(
    requests_per_second=st.floats(min_value=0.1, max_value=100),
    burst_size=st.integers(min_value=1, max_value=100),
)
@pytest.mark.asyncio
async def test_rate_limiter_respects_limits(
    requests_per_second: float,
    burst_size: int,
):
    """Test that rate limiter respects configured limits."""
    config = RateLimitConfig(
        requests_per_second=requests_per_second,
        burst_size=burst_size,
        use_redis=False,  # Local testing
    )
    
    async with DistributedRateLimiter(config) as limiter:
        start_time = asyncio.get_event_loop().time()
        request_times = []
        
        for _ in range(burst_size + 5):
            async with limiter.acquire("test.com"):
                request_times.append(asyncio.get_event_loop().time())
        
        # Verify rate limiting
        elapsed = request_times[-1] - start_time
        expected_min_time = (burst_size + 5 - burst_size) / requests_per_second
        
        assert elapsed >= expected_min_time * 0.9  # Allow 10% tolerance
\`\`\``,
      reasoning: 'This example showcases modern Python 3.12+ features including PEP 695 generic syntax, advanced type hints, async/await patterns, Pydantic v2, distributed rate limiting with Redis, property-based testing, and modern project structure with pyproject.toml and strict mypy configuration.'
    }
  ]
};

export const rustPro: SpecialistDefinition = {
  name: 'rust-pro',
  description: 'Expert Rust developer specializing in systems programming, async runtime development, WebAssembly, and embedded systems. Proficient in advanced lifetime management, zero-cost abstractions, and building high-performance, memory-safe applications for 2024-2025.',
  category: 'language',
  focusAreas: [
    'Advanced ownership patterns and lifetime annotations',
    'Async Rust with Tokio, async-std, and custom runtimes',
    'Zero-copy deserialization with serde and bincode',
    'WebAssembly (WASM) and wasm-bindgen for browser/edge',
    'Embedded systems with no_std and const generics',
    'Advanced trait design with associated types and GATs',
    'Procedural macro development with syn and quote',
    'Unsafe Rust and FFI with C/C++ interop',
    'Lock-free data structures and atomics',
    'Performance optimization with SIMD and vectorization',
    'Error handling with thiserror and anyhow',
    'Cross-platform development with conditional compilation',
    'Rust 2024 Edition features and nightly innovations',
    'GPU programming with wgpu and rust-gpu',
    'Network programming with quinn (QUIC) and tower'
  ],
  approach: [
    'Design with ownership and borrowing from the start',
    'Use type system to make invalid states unrepresentable',
    'Leverage const generics for compile-time guarantees',
    'Profile with cargo flamegraph and criterion benchmarks',
    'Write comprehensive documentation with rustdoc',
    'Use cargo clippy and rustfmt for code quality',
    'Implement Display, Debug, and Error traits properly',
    'Design zero-cost abstractions with inline hints',
    'Test with proptest for property-based testing',
    'Use workspace features for modular architecture'
  ],
  outputs: [
    'Production-ready Rust crates with full documentation',
    'Trait hierarchies with blanket implementations',
    'Comprehensive rustdoc with examples and doctests',
    'Criterion benchmark suites with performance tracking',
    'Memory safety proofs and unsafe code audits',
    'WebAssembly modules with TypeScript bindings',
    'Procedural macros for code generation',
    'Cross-platform CI/CD with GitHub Actions',
    'Cargo workspace configurations',
    'Security advisories and audit reports'
  ],
  keyPrinciple: 'Fearless concurrency through ownership: Build blazingly fast, memory-safe systems with zero-cost abstractions and compile-time guarantees',
  examples: [
    {
      input: 'Build a high-performance async web server with connection pooling and graceful shutdown',
      output: `## High-Performance Async Web Server in Rust

### Project Structure
\`\`\`
async-web-server/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── server.rs
│   ├── handler.rs
│   ├── connection_pool.rs
│   ├── middleware.rs
│   └── lib.rs
├── benches/
│   └── server_bench.rs
└── tests/
    └── integration_test.rs
\`\`\`

### Cargo.toml with 2024 Dependencies
\`\`\`toml
[package]
name = "async-web-server"
version = "1.0.0"
edition = "2021"
rust-version = "1.75"

[dependencies]
tokio = { version = "1.35", features = ["full"] }
axum = "0.7"
tower = { version = "0.4", features = ["full"] }
tower-http = { version = "0.5", features = ["trace", "compression", "cors"] }
hyper = { version = "1.1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "1.0"
anyhow = "1.0"
deadpool = "0.10"
deadpool-postgres = "0.12"
tokio-postgres = { version = "0.7", features = ["with-serde_json-1"] }
once_cell = "1.19"
arc-swap = "1.6"
dashmap = "5.5"
bytes = "1.5"
futures = "0.3"
pin-project = "1.1"

[dev-dependencies]
criterion = { version = "0.5", features = ["async_tokio"] }
proptest = "1.4"
tokio-test = "0.4"

[[bench]]
name = "server_bench"
harness = false

[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
\`\`\`

### Connection Pool with Zero-Copy (src/connection_pool.rs)
\`\`\`rust
use std::{
    ops::Deref,
    sync::Arc,
    time::Duration,
};
use deadpool::managed::{self, Metrics};
use tokio_postgres::{Client, NoTls, Config};
use thiserror::Error;
use tracing::{info, warn};

#[derive(Debug, Error)]
pub enum PoolError {
    #[error("Connection pool error: {0}")]
    Pool(#[from] managed::PoolError<tokio_postgres::Error>),
    
    #[error("Database error: {0}")]
    Database(#[from] tokio_postgres::Error),
    
    #[error("Configuration error: {0}")]
    Config(String),
}

/// Zero-copy connection wrapper using Arc
pub struct Connection {
    inner: Arc<managed::Object<Manager>>,
}

impl Deref for Connection {
    type Target = Client;
    
    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

/// Custom connection manager with health checks
pub struct Manager {
    config: Config,
}

impl Manager {
    pub fn new(database_url: &str) -> Result<Self, PoolError> {
        let config = database_url
            .parse::<Config>()
            .map_err(|e| PoolError::Config(e.to_string()))?;
        
        Ok(Self { config })
    }
}

#[async_trait::async_trait]
impl managed::Manager for Manager {
    type Type = Client;
    type Error = tokio_postgres::Error;
    
    async fn create(&self) -> Result<Client, Self::Error> {
        let (client, connection) = self.config.connect(NoTls).await?;
        
        // Spawn connection handler
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                warn!("Connection error: {}", e);
            }
        });
        
        // Perform health check
        client.simple_query("SELECT 1").await?;
        
        Ok(client)
    }
    
    async fn recycle(
        &self,
        conn: &mut Client,
        _: &Metrics,
    ) -> managed::RecycleResult<Self::Error> {
        // Check connection health
        match conn.simple_query("SELECT 1").await {
            Ok(_) => Ok(()),
            Err(e) => Err(managed::RecycleError::Backend(e)),
        }
    }
}

/// High-performance connection pool with monitoring
pub struct ConnectionPool {
    inner: managed::Pool<Manager>,
}

impl ConnectionPool {
    pub fn new(database_url: &str, max_size: usize) -> Result<Self, PoolError> {
        let manager = Manager::new(database_url)?;
        
        let pool = managed::Pool::builder(manager)
            .max_size(max_size)
            .wait_timeout(Some(Duration::from_secs(5)))
            .create_timeout(Some(Duration::from_secs(5)))
            .recycle_timeout(Some(Duration::from_secs(5)))
            .build()
            .map_err(|e| PoolError::Config(e.to_string()))?;
        
        Ok(Self { inner: pool })
    }
    
    pub async fn get(&self) -> Result<Connection, PoolError> {
        let conn = self.inner.get().await?;
        Ok(Connection {
            inner: Arc::new(conn),
        })
    }
    
    pub fn status(&self) -> managed::Status {
        self.inner.status()
    }
}
\`\`\`

### Lock-Free Request Handler (src/handler.rs)
\`\`\`rust
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    trace::TraceLayer,
};
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub pool: Arc<ConnectionPool>,
    pub cache: Arc<DashMap<String, CachedResponse>>,
    pub metrics: Arc<Metrics>,
}

#[derive(Clone, Serialize)]
struct CachedResponse {
    data: serde_json::Value,
    cached_at: Instant,
}

#[derive(Default)]
pub struct Metrics {
    requests: atomic::AtomicU64,
    cache_hits: atomic::AtomicU64,
    cache_misses: atomic::AtomicU64,
}

use std::sync::atomic::{self, Ordering};

impl Metrics {
    pub fn record_request(&self) {
        self.requests.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn record_cache_hit(&self) {
        self.cache_hits.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn record_cache_miss(&self) {
        self.cache_misses.fetch_add(1, Ordering::Relaxed);
    }
}

#[derive(Deserialize)]
pub struct ListQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

/// High-performance handler with caching
pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.metrics.record_request();
    
    let cache_key = format!("user:{}", user_id);
    
    // Check cache first (lock-free read)
    if let Some(cached) = state.cache.get(&cache_key) {
        if cached.cached_at.elapsed() < Duration::from_secs(300) {
            state.metrics.record_cache_hit();
            return Ok(Json(cached.data.clone()));
        }
    }
    
    state.metrics.record_cache_miss();
    
    // Get connection from pool
    let conn = state.pool.get().await?;
    
    // Query with prepared statement
    let row = conn
        .query_one(
            "SELECT id, name, email, created_at FROM users WHERE id = $1",
            &[&user_id],
        )
        .await?;
    
    let user = serde_json::json!({
        "id": row.get::<_, i64>(0),
        "name": row.get::<_, String>(1),
        "email": row.get::<_, String>(2),
        "created_at": row.get::<_, chrono::DateTime<chrono::Utc>>(3),
    });
    
    // Update cache
    state.cache.insert(
        cache_key,
        CachedResponse {
            data: user.clone(),
            cached_at: Instant::now(),
        },
    );
    
    Ok(Json(user))
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] PoolError),
    
    #[error("Not found")]
    NotFound,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not found"),
        };
        
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
\`\`\`

### Main Server with Graceful Shutdown (src/server.rs)
\`\`\`rust
use std::{
    net::SocketAddr,
    sync::Arc,
    time::Duration,
};
use axum::{
    routing::{get, post},
    Router,
};
use tokio::{
    signal,
    sync::Notify,
    time::timeout,
};
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    trace::{DefaultMakeSpan, TraceLayer},
};
use tracing::{info, warn};

pub struct Server {
    router: Router,
    addr: SocketAddr,
    shutdown_timeout: Duration,
}

impl Server {
    pub fn new(state: AppState, addr: SocketAddr) -> Self {
        let router = Router::new()
            .route("/health", get(health_check))
            .route("/users/:id", get(handler::get_user))
            .route("/users", post(handler::create_user))
            .route("/metrics", get(metrics_handler))
            .layer(
                ServiceBuilder::new()
                    .layer(TraceLayer::new_for_http())
                    .layer(CompressionLayer::new())
                    .layer(CorsLayer::permissive())
                    .layer(tower::limit::ConcurrencyLimitLayer::new(1000))
                    .layer(tower::timeout::TimeoutLayer::new(Duration::from_secs(30))),
            )
            .with_state(state);
        
        Self {
            router,
            addr,
            shutdown_timeout: Duration::from_secs(30),
        }
    }
    
    pub async fn run(self) -> anyhow::Result<()> {
        let shutdown_notify = Arc::new(Notify::new());
        let shutdown_notify_clone = shutdown_notify.clone();
        
        // Spawn shutdown handler
        tokio::spawn(async move {
            shutdown_signal().await;
            info!("Shutdown signal received");
            shutdown_notify_clone.notify_waiters();
        });
        
        // Create listener
        let listener = tokio::net::TcpListener::bind(&self.addr).await?;
        info!("Server listening on {}", self.addr);
        
        // Run server with graceful shutdown
        axum::serve(listener, self.router)
            .with_graceful_shutdown(async move {
                shutdown_notify.notified().await;
            })
            .await?;
        
        info!("Server shutdown complete");
        Ok(())
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };
    
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };
    
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    
    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

async fn health_check() -> &'static str {
    "OK"
}

async fn metrics_handler(State(state): State<AppState>) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "requests": state.metrics.requests.load(Ordering::Relaxed),
        "cache_hits": state.metrics.cache_hits.load(Ordering::Relaxed),
        "cache_misses": state.metrics.cache_misses.load(Ordering::Relaxed),
        "pool_status": {
            "size": state.pool.status().size,
            "available": state.pool.status().available,
        },
    }))
}
\`\`\`

### Criterion Benchmarks (benches/server_bench.rs)
\`\`\`rust
use criterion::{criterion_group, criterion_main, Criterion, BenchmarkId};
use std::time::Duration;

async fn bench_connection_pool(pool: &ConnectionPool) {
    let conn = pool.get().await.unwrap();
    let _ = conn.query_one("SELECT 1", &[]).await.unwrap();
}

fn connection_pool_benchmark(c: &mut Criterion) {
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let pool = runtime.block_on(async {
        ConnectionPool::new("postgres://localhost/bench", 50)
            .expect("Failed to create pool")
    });
    
    let mut group = c.benchmark_group("connection_pool");
    group.measurement_time(Duration::from_secs(10));
    
    for size in [10, 50, 100, 500].iter() {
        group.bench_with_input(
            BenchmarkId::new("concurrent_queries", size),
            size,
            |b, &size| {
                b.to_async(&runtime).iter(|| async {
                    let futures: Vec<_> = (0..size)
                        .map(|_| bench_connection_pool(&pool))
                        .collect();
                    futures::future::join_all(futures).await;
                });
            },
        );
    }
    
    group.finish();
}

criterion_group!(benches, connection_pool_benchmark);
criterion_main!(benches);
\`\`\``,
      reasoning: 'This example demonstrates advanced Rust features including async/await with Tokio, zero-copy patterns with Arc, lock-free concurrent data structures with DashMap, connection pooling with deadpool, comprehensive error handling, graceful shutdown, and performance benchmarking with Criterion.'
    }
  ]
};

export const golangPro: SpecialistDefinition = {
  name: 'golang-pro',
  description: 'Expert Go developer specializing in high-performance concurrent systems, microservices, and cloud-native applications. Proficient in Go 1.21+ features, advanced concurrency patterns, and building scalable distributed systems for 2024-2025.',
  category: 'language',
  focusAreas: [
    'Go 1.21+ features (generics, structured logging, enhanced errors)',
    'Advanced concurrency with goroutines, channels, and sync primitives',
    'Context-aware programming and cancellation patterns',
    'gRPC and protocol buffers for microservices',
    'Kubernetes operators and controllers in Go',
    'High-performance HTTP servers with net/http and Fiber',
    'Database connections with sqlx and GORM v2',
    'Distributed tracing with OpenTelemetry',
    'Memory optimization and escape analysis',
    'Testing with table-driven tests and testify',
    'Benchmarking and profiling with pprof',
    'WebAssembly compilation with TinyGo',
    'Embedded systems and IoT with Go',
    'CLI tools with Cobra and Viper',
    'Error handling with errors.Is/As and wrapped errors'
  ],
  approach: [
    'Write simple, readable code following Go Proverbs',
    'Design concurrent systems with CSP principles',
    'Use interfaces to define behavior, not data',
    'Apply the Rule of Three for abstractions',
    'Handle errors explicitly with proper context',
    'Optimize hot paths after profiling',
    'Use go:generate for code generation',
    'Implement graceful shutdown patterns',
    'Apply dependency injection for testability',
    'Document with examples in godoc format'
  ],
  outputs: [
    'Production-ready Go modules with go.mod',
    'Well-designed interface hierarchies',
    'Comprehensive test suites with >80% coverage',
    'Benchmark results with memory allocations',
    'Godoc documentation with runnable examples',
    'Dockerfile with multi-stage builds',
    'Kubernetes manifests and Helm charts',
    'CI/CD pipelines with GitHub Actions',
    'Protocol buffer definitions',
    'Performance profiling reports'
  ],
  keyPrinciple: 'Concurrency is not parallelism: Build simple, composable systems that scale through goroutines and channels, embracing Go\'s CSP model',
  examples: [
    {
      input: 'Create a high-performance worker pool with graceful shutdown and backpressure handling',
      output: `## High-Performance Worker Pool in Go

### Project Structure
\`\`\`
worker-pool/
├── go.mod
├── go.sum
├── cmd/
│   └── worker/
│       └── main.go
├── internal/
│   ├── pool/
│   │   ├── pool.go
│   │   ├── worker.go
│   │   └── metrics.go
│   └── job/
│       ├── job.go
│       └── processor.go
├── pkg/
│   └── backpressure/
│       └── limiter.go
└── tests/
    └── pool_test.go
\`\`\`

### go.mod with Latest Dependencies
\`\`\`go
module github.com/example/worker-pool

go 1.21

require (
	github.com/prometheus/client_golang v1.18.0
	github.com/stretchr/testify v1.8.4
	go.uber.org/zap v1.26.0
	golang.org/x/sync v0.6.0
	golang.org/x/time v0.5.0
)
\`\`\`

### Generic Job Interface (internal/job/job.go)
\`\`\`go
package job

import (
	"context"
	"time"
)

// Job represents a unit of work with generic type parameter
type Job[T any, R any] interface {
	ID() string
	Execute(ctx context.Context) (R, error)
	Payload() T
	Priority() int
	CreatedAt() time.Time
}

// Result wraps job execution results
type Result[R any] struct {
	JobID    string
	Result   R
	Error    error
	Duration time.Duration
}

// BaseJob provides common job functionality
type BaseJob[T any] struct {
	id        string
	payload   T
	priority  int
	createdAt time.Time
}

func NewBaseJob[T any](id string, payload T, priority int) BaseJob[T] {
	return BaseJob[T]{
		id:        id,
		payload:   payload,
		priority:  priority,
		createdAt: time.Now(),
	}
}

func (j BaseJob[T]) ID() string         { return j.id }
func (j BaseJob[T]) Payload() T         { return j.payload }
func (j BaseJob[T]) Priority() int      { return j.priority }
func (j BaseJob[T]) CreatedAt() time.Time { return j.createdAt }
\`\`\`

### Worker Pool with Generics (internal/pool/pool.go)
\`\`\`go
package pool

import (
	"context"
	"fmt"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"github.com/example/worker-pool/internal/job"
	"github.com/example/worker-pool/pkg/backpressure"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

// Pool manages a pool of workers with backpressure
type Pool[T any, R any] struct {
	workers       int
	jobQueue      chan job.Job[T, R]
	resultQueue   chan job.Result[R]
	backpressure  *backpressure.Limiter
	metrics       *Metrics
	logger        *zap.Logger
	shutdownOnce  sync.Once
	shutdownCh    chan struct{}
	wg            sync.WaitGroup

	// Atomic counters
	processedJobs atomic.Int64
	failedJobs    atomic.Int64
	activeTasks   atomic.Int32
}

// Config for pool initialization
type Config struct {
	Workers      int
	QueueSize    int
	MaxBurst     int
	RateLimit    int // jobs per second
	Logger       *zap.Logger
	MetricsAddr  string
}

// New creates a new worker pool
func New[T any, R any](cfg Config) (*Pool[T, R], error) {
	if cfg.Workers <= 0 {
		cfg.Workers = runtime.NumCPU()
	}

	if cfg.Logger == nil {
		cfg.Logger = zap.NewNop()
	}

	p := &Pool[T, R]{
		workers:      cfg.Workers,
		jobQueue:     make(chan job.Job[T, R], cfg.QueueSize),
		resultQueue:  make(chan job.Result[R], cfg.QueueSize),
		backpressure: backpressure.NewLimiter(cfg.RateLimit, cfg.MaxBurst),
		metrics:      NewMetrics(),
		logger:       cfg.Logger,
		shutdownCh:   make(chan struct{}),
	}

	// Start metrics server if configured
	if cfg.MetricsAddr != "" {
		if err := p.metrics.Start(cfg.MetricsAddr); err != nil {
			return nil, fmt.Errorf("failed to start metrics: %w", err)
		}
	}

	return p, nil
}

// Start initializes and runs workers
func (p *Pool[T, R]) Start(ctx context.Context) error {
	p.logger.Info("Starting worker pool", zap.Int("workers", p.workers))

	g, ctx := errgroup.WithContext(ctx)

	// Start workers
	for i := 0; i < p.workers; i++ {
		workerID := fmt.Sprintf("worker-%d", i)
		g.Go(func() error {
			return p.runWorker(ctx, workerID)
		})
	}

	// Monitor system health
	g.Go(func() error {
		return p.monitorHealth(ctx)
	})

	return g.Wait()
}

// Submit adds a job to the queue with backpressure
func (p *Pool[T, R]) Submit(ctx context.Context, job job.Job[T, R]) error {
	// Apply backpressure
	if err := p.backpressure.Wait(ctx); err != nil {
		p.metrics.RecordDroppedJob()
		return fmt.Errorf("backpressure limit: %w", err)
	}

	// Check if pool is shutting down
	select {
	case <-p.shutdownCh:
		return fmt.Errorf("pool is shutting down")
	default:
	}

	// Submit job
	select {
	case p.jobQueue <- job:
		p.metrics.RecordSubmittedJob()
		return nil
	case <-ctx.Done():
		return ctx.Err()
	case <-p.shutdownCh:
		return fmt.Errorf("pool is shutting down")
	}
}

// Results returns the result channel
func (p *Pool[T, R]) Results() <-chan job.Result[R] {
	return p.resultQueue
}

// Shutdown gracefully stops the pool
func (p *Pool[T, R]) Shutdown(timeout time.Duration) error {
	var err error
	p.shutdownOnce.Do(func() {
		p.logger.Info("Initiating graceful shutdown")
		close(p.shutdownCh)

		// Wait for workers with timeout
		done := make(chan struct{})
		go func() {
			p.wg.Wait()
			close(done)
		}()

		select {
		case <-done:
			p.logger.Info("All workers stopped")
		case <-time.After(timeout):
			err = fmt.Errorf("shutdown timeout after %v", timeout)
			p.logger.Error("Shutdown timeout", zap.Error(err))
		}

		// Close channels
		close(p.jobQueue)
		close(p.resultQueue)
	})

	return err
}

// runWorker processes jobs from the queue
func (p *Pool[T, R]) runWorker(ctx context.Context, id string) error {
	p.wg.Add(1)
	defer p.wg.Done()

	p.logger.Info("Worker started", zap.String("id", id))

	for {
		select {
		case job, ok := <-p.jobQueue:
			if !ok {
				p.logger.Info("Worker stopping", zap.String("id", id))
				return nil
			}

			p.processJob(ctx, job)

		case <-ctx.Done():
			return ctx.Err()
		case <-p.shutdownCh:
			return nil
		}
	}
}

// processJob executes a single job
func (p *Pool[T, R]) processJob(ctx context.Context, j job.Job[T, R]) {
	p.activeTasks.Add(1)
	defer p.activeTasks.Add(-1)

	start := time.Now()
	result, err := j.Execute(ctx)
	duration := time.Since(start)

	// Record metrics
	p.processedJobs.Add(1)
	p.metrics.RecordJobDuration(duration)

	if err != nil {
		p.failedJobs.Add(1)
		p.metrics.RecordFailedJob()
		p.logger.Error("Job failed",
			zap.String("job_id", j.ID()),
			zap.Error(err),
			zap.Duration("duration", duration),
		)
	} else {
		p.metrics.RecordSuccessfulJob()
	}

	// Send result
	select {
	case p.resultQueue <- job.Result[R]{
		JobID:    j.ID(),
		Result:   result,
		Error:    err,
		Duration: duration,
	}:
	case <-p.shutdownCh:
		// Pool is shutting down, discard result
	}
}

// monitorHealth tracks pool health metrics
func (p *Pool[T, R]) monitorHealth(ctx context.Context) error {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			active := p.activeTasks.Load()
			processed := p.processedJobs.Load()
			failed := p.failedJobs.Load()
			queueLen := len(p.jobQueue)

			p.logger.Info("Pool health",
				zap.Int32("active_tasks", active),
				zap.Int64("processed_jobs", processed),
				zap.Int64("failed_jobs", failed),
				zap.Int("queue_length", queueLen),
			)

			p.metrics.UpdateHealth(active, processed, failed, queueLen)

		case <-ctx.Done():
			return ctx.Err()
		case <-p.shutdownCh:
			return nil
		}
	}
}
\`\`\`

### Backpressure Implementation (pkg/backpressure/limiter.go)
\`\`\`go
package backpressure

import (
	"context"
	"fmt"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// Limiter provides adaptive backpressure
type Limiter struct {
	limiter      *rate.Limiter
	burst        int
	mu           sync.RWMutex
	successCount int64
	failureCount int64
	lastAdjust   time.Time
}

// NewLimiter creates a new adaptive rate limiter
func NewLimiter(rateLimit, burst int) *Limiter {
	return &Limiter{
		limiter:    rate.NewLimiter(rate.Limit(rateLimit), burst),
		burst:      burst,
		lastAdjust: time.Now(),
	}
}

// Wait blocks until rate limit allows
func (l *Limiter) Wait(ctx context.Context) error {
	return l.limiter.Wait(ctx)
}

// Allow checks if operation is allowed
func (l *Limiter) Allow() bool {
	return l.limiter.Allow()
}

// RecordSuccess updates success metrics
func (l *Limiter) RecordSuccess() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.successCount++
	l.maybeAdjustRate()
}

// RecordFailure updates failure metrics
func (l *Limiter) RecordFailure() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.failureCount++
	l.maybeAdjustRate()
}

// maybeAdjustRate implements adaptive rate limiting
func (l *Limiter) maybeAdjustRate() {
	if time.Since(l.lastAdjust) < time.Minute {
		return
	}

	total := l.successCount + l.failureCount
	if total == 0 {
		return
	}

	successRate := float64(l.successCount) / float64(total)
	currentLimit := l.limiter.Limit()

	// Adjust rate based on success rate
	var newLimit rate.Limit
	switch {
	case successRate > 0.95:
		// Increase rate by 10%
		newLimit = currentLimit * 1.1
	case successRate < 0.80:
		// Decrease rate by 20%
		newLimit = currentLimit * 0.8
	default:
		// Keep current rate
		return
	}

	// Apply bounds
	if newLimit < 1 {
		newLimit = 1
	}
	if newLimit > 10000 {
		newLimit = 10000
	}

	l.limiter.SetLimit(newLimit)
	l.limiter.SetBurst(l.burst)
	l.successCount = 0
	l.failureCount = 0
	l.lastAdjust = time.Now()
}

// Stats returns current limiter statistics
func (l *Limiter) Stats() (limit rate.Limit, burst int, successRate float64) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	total := l.successCount + l.failureCount
	if total > 0 {
		successRate = float64(l.successCount) / float64(total)
	}

	return l.limiter.Limit(), l.limiter.Burst(), successRate
}
\`\`\`

### Example Usage (cmd/worker/main.go)
\`\`\`go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/example/worker-pool/internal/job"
	"github.com/example/worker-pool/internal/pool"
	"go.uber.org/zap"
)

// ImageProcessingJob processes images
type ImageProcessingJob struct {
	job.BaseJob[string]
}

func (j ImageProcessingJob) Execute(ctx context.Context) (string, error) {
	// Simulate image processing
	select {
	case <-time.After(100 * time.Millisecond):
		return fmt.Sprintf("processed_%s", j.Payload()), nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Create pool configuration
	cfg := pool.Config{
		Workers:     10,
		QueueSize:   1000,
		MaxBurst:    50,
		RateLimit:   100, // 100 jobs/second
		Logger:      logger,
		MetricsAddr: ":8080",
	}

	// Create worker pool
	p, err := pool.New[string, string](cfg)
	if err != nil {
		log.Fatal(err)
	}

	// Setup signal handling
	ctx, cancel := context.WithCancel(context.Background())
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start pool
	go func() {
		if err := p.Start(ctx); err != nil {
			logger.Error("Pool error", zap.Error(err))
		}
	}()

	// Process results
	go func() {
		for result := range p.Results() {
			if result.Error != nil {
				logger.Error("Job failed",
					zap.String("job_id", result.JobID),
					zap.Error(result.Error),
				)
			} else {
				logger.Info("Job completed",
					zap.String("job_id", result.JobID),
					zap.String("result", result.Result),
					zap.Duration("duration", result.Duration),
				)
			}
		}
	}()

	// Submit jobs
	go func() {
		for i := 0; i < 1000; i++ {
			job := ImageProcessingJob{
				BaseJob: job.NewBaseJob(
					fmt.Sprintf("job-%d", i),
					fmt.Sprintf("image-%d.jpg", i),
					i%3, // priority
				),
			}

			if err := p.Submit(ctx, job); err != nil {
				logger.Warn("Failed to submit job", zap.Error(err))
			}
		}
	}()

	// Wait for signal
	<-sigChan
	logger.Info("Received shutdown signal")

	// Cancel context and shutdown pool
	cancel()
	if err := p.Shutdown(30 * time.Second); err != nil {
		logger.Error("Shutdown error", zap.Error(err))
	}
}
\`\`\``,
      reasoning: 'This example demonstrates modern Go patterns including generics, context-aware cancellation, structured concurrency with errgroup, atomic operations, adaptive backpressure, comprehensive metrics, and graceful shutdown patterns - showcasing enterprise-grade concurrent system design.'
    }
  ]
};

export const javascriptPro: SpecialistDefinition = {
  name: 'javascript-pro',
  description: 'Expert JavaScript developer specializing in ES2024+ features, modern runtime APIs, and high-performance web applications. Proficient in Node.js 21+, Deno, Bun, browser APIs, and cutting-edge JavaScript patterns for 2024-2025.',
  category: 'language',
  focusAreas: [
    'ES2024+ features (decorators, temporal API, pattern matching)',
    'Modern async patterns (async iterators, top-level await)',
    'Advanced module systems (ESM, dynamic imports, import maps)',
    'Functional programming with immutability and composition',
    'Performance optimization for V8, SpiderMonkey, and JavaScriptCore',
    'Modern browser APIs (WebGPU, WebTransport, Web Components)',
    'Node.js 21+ with native TypeScript support',
    'Deno 2.0 and Bun runtime optimization',
    'Service Workers and Progressive Web Apps',
    'WebAssembly integration and bindings',
    'Reactive programming with RxJS and signals',
    'Real-time applications with WebSockets and WebRTC',
    'Edge computing with Cloudflare Workers',
    'Testing with Vitest and Playwright',
    'Build tools optimization (Vite, esbuild, SWC)'
  ],
  approach: [
    'Write ES2024+ code with modern syntax and features',
    'Apply functional programming principles for cleaner code',
    'Use native browser APIs before reaching for libraries',
    'Optimize for modern JavaScript engines',
    'Implement proper error boundaries and handling',
    'Design for performance with lazy loading and code splitting',
    'Use Web Workers for CPU-intensive tasks',
    'Apply security best practices (CSP, CORS, sanitization)',
    'Write comprehensive tests with modern tools',
    'Document with JSDoc and type annotations'
  ],
  outputs: [
    'ES2024+ JavaScript modules with full JSDoc',
    'NPM/JSR packages with ESM and CJS builds',
    'Comprehensive test suites with Vitest/Jest',
    'Optimized build configurations with Vite/webpack',
    'Performance benchmarks and metrics',
    'PWA manifests and service workers',
    'WebAssembly modules with JS bindings',
    'Edge function deployments',
    'Browser extension packages',
    'Real-time application architectures'
  ],
  keyPrinciple: 'JavaScript everywhere: Build performant, scalable applications leveraging ES2024+ features, modern runtimes, and cutting-edge web platform APIs',
  examples: [
    {
      input: 'Create a real-time collaborative editor with WebRTC, operational transforms, and offline support',
      output: `## Real-Time Collaborative Editor (ES2024+)

### Project Structure
\`\`\`
collaborative-editor/
├── package.json
├── src/
│   ├── editor/
│   │   ├── Editor.js
│   │   ├── CRDTDocument.js
│   │   └── OperationalTransform.js
│   ├── network/
│   │   ├── WebRTCConnection.js
│   │   ├── SignalingServer.js
│   │   └── PeerManager.js
│   ├── sync/
│   │   ├── OfflineSync.js
│   │   └── ConflictResolver.js
│   └── workers/
│       └── sync.worker.js
├── public/
│   └── index.html
└── vite.config.js
\`\`\`

### Modern Package Configuration
\`\`\`json
{
  "name": "collaborative-editor",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=21.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "yjs": "^13.6",
    "y-webrtc": "^10.3",
    "idb": "^8.0",
    "nanoid": "^5.0"
  },
  "devDependencies": {
    "vite": "^5.0",
    "vitest": "^1.1",
    "@playwright/test": "^1.40"
  }
}
\`\`\`

### CRDT Document Implementation (src/editor/CRDTDocument.js)
\`\`\`javascript
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Using ES2024 decorators for observable properties
const observable = (target, key, descriptor) => {
  const symbol = Symbol(key);
  return {
    get() {
      return this[symbol];
    },
    set(value) {
      const oldValue = this[symbol];
      this[symbol] = value;
      this.emit('change', { key, oldValue, newValue: value });
    },
    enumerable: true,
    configurable: true
  };
};

export class CRDTDocument extends EventTarget {
  #doc;
  #text;
  #awareness;
  #persistence;
  #undoManager;
  
  @observable
  status = 'initializing';
  
  constructor(documentId, userId) {
    super();
    this.documentId = documentId;
    this.userId = userId;
    
    // Initialize Yjs document
    this.#doc = new Y.Doc();
    this.#text = this.#doc.getText('content');
    this.#awareness = new Y.Awareness(this.#doc);
    
    // Setup undo/redo
    this.#undoManager = new Y.UndoManager(this.#text, {
      trackedOrigins: new Set(['user'])
    });
    
    // Enable offline persistence
    this.#persistence = new IndexeddbPersistence(documentId, this.#doc);
    
    this.#setupEventHandlers();
  }
  
  #setupEventHandlers() {
    // Document changes
    this.#text.observe((event, transaction) => {
      this.dispatchEvent(new CustomEvent('textchange', {
        detail: {
          delta: event.delta,
          origin: transaction.origin,
          local: transaction.local
        }
      }));
    });
    
    // Awareness updates (cursor positions, selections)
    this.#awareness.on('change', ({ added, updated, removed }) => {
      this.dispatchEvent(new CustomEvent('awarenesschange', {
        detail: { added, updated, removed }
      }));
    });
    
    // Sync status
    this.#doc.on('sync', (isSynced) => {
      this.status = isSynced ? 'synced' : 'syncing';
    });
  }
  
  // Insert text with operational transform
  insertText(index, text, attributes = {}) {
    this.#text.insert(index, text, attributes, 'user');
  }
  
  // Delete text
  deleteText(index, length) {
    this.#text.delete(index, length, 'user');
  }
  
  // Get document content
  getText() {
    return this.#text.toString();
  }
  
  // Get document state for sync
  getStateVector() {
    return Y.encodeStateVector(this.#doc);
  }
  
  // Apply remote changes
  applyUpdate(update) {
    Y.applyUpdate(this.#doc, update, 'remote');
  }
  
  // Undo/Redo operations
  undo() {
    this.#undoManager.undo();
  }
  
  redo() {
    this.#undoManager.redo();
  }
  
  // Set user awareness (cursor, selection)
  setAwareness(state) {
    this.#awareness.setLocalState({
      user: {
        id: this.userId,
        ...state
      }
    });
  }
  
  // Get all users' awareness states
  getAwarenessStates() {
    return this.#awareness.getStates();
  }
  
  // Cleanup
  destroy() {
    this.#persistence.destroy();
    this.#doc.destroy();
  }
}
\`\`\`

### WebRTC Connection Manager (src/network/WebRTCConnection.js)
\`\`\`javascript
// Using ES2024 async iterators and top-level await
const stunServers = await fetch('/api/stun-servers').then(r => r.json());

export class WebRTCConnection extends EventTarget {
  #pc;
  #dataChannel;
  #signaling;
  #peerId;
  #isInitiator;
  #messageQueue = [];
  #connected = false;
  
  constructor(signaling, peerId, isInitiator = false) {
    super();
    this.#signaling = signaling;
    this.#peerId = peerId;
    this.#isInitiator = isInitiator;
    
    this.#initializePeerConnection();
  }
  
  async #initializePeerConnection() {
    this.#pc = new RTCPeerConnection({
      iceServers: stunServers,
      iceCandidatePoolSize: 10
    });
    
    // Handle ICE candidates
    this.#pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.#signaling.send({
          type: 'ice-candidate',
          target: this.#peerId,
          candidate
        });
      }
    };
    
    // Connection state monitoring
    this.#pc.onconnectionstatechange = () => {
      this.dispatchEvent(new CustomEvent('connectionstatechange', {
        detail: { state: this.#pc.connectionState }
      }));
      
      if (this.#pc.connectionState === 'failed') {
        this.reconnect();
      }
    };
    
    if (this.#isInitiator) {
      this.#createDataChannel();
      await this.#createOffer();
    } else {
      this.#pc.ondatachannel = (event) => {
        this.#setupDataChannel(event.channel);
      };
    }
  }
  
  #createDataChannel() {
    this.#dataChannel = this.#pc.createDataChannel('editor', {
      ordered: true,
      maxRetransmits: 3
    });
    this.#setupDataChannel(this.#dataChannel);
  }
  
  #setupDataChannel(channel) {
    this.#dataChannel = channel;
    
    channel.binaryType = 'arraybuffer';
    
    channel.onopen = () => {
      this.#connected = true;
      this.dispatchEvent(new Event('open'));
      this.#flushMessageQueue();
    };
    
    channel.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      this.dispatchEvent(new CustomEvent('message', { detail: data }));
    };
    
    channel.onerror = (error) => {
      console.error('DataChannel error:', error);
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    };
    
    channel.onclose = () => {
      this.#connected = false;
      this.dispatchEvent(new Event('close'));
    };
  }
  
  async #createOffer() {
    const offer = await this.#pc.createOffer();
    await this.#pc.setLocalDescription(offer);
    
    this.#signaling.send({
      type: 'offer',
      target: this.#peerId,
      offer
    });
  }
  
  async handleSignalingMessage(message) {
    switch (message.type) {
      case 'offer':
        await this.#handleOffer(message.offer);
        break;
      case 'answer':
        await this.#handleAnswer(message.answer);
        break;
      case 'ice-candidate':
        await this.#handleIceCandidate(message.candidate);
        break;
    }
  }
  
  async #handleOffer(offer) {
    await this.#pc.setRemoteDescription(offer);
    const answer = await this.#pc.createAnswer();
    await this.#pc.setLocalDescription(answer);
    
    this.#signaling.send({
      type: 'answer',
      target: this.#peerId,
      answer
    });
  }
  
  async #handleAnswer(answer) {
    await this.#pc.setRemoteDescription(answer);
  }
  
  async #handleIceCandidate(candidate) {
    try {
      await this.#pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
  
  send(data) {
    if (!this.#connected || this.#dataChannel.readyState !== 'open') {
      this.#messageQueue.push(data);
      return;
    }
    
    try {
      this.#dataChannel.send(data);
    } catch (error) {
      console.error('Send error:', error);
      this.#messageQueue.push(data);
    }
  }
  
  #flushMessageQueue() {
    while (this.#messageQueue.length > 0 && this.#connected) {
      const data = this.#messageQueue.shift();
      this.send(data);
    }
  }
  
  async reconnect() {
    this.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.#initializePeerConnection();
  }
  
  close() {
    this.#dataChannel?.close();
    this.#pc?.close();
  }
  
  // Async iterator for messages
  async *messages() {
    const queue = [];
    let resolve;
    
    const handler = (event) => {
      if (resolve) {
        resolve(event.detail);
        resolve = null;
      } else {
        queue.push(event.detail);
      }
    };
    
    this.addEventListener('message', handler);
    
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          yield await new Promise(r => resolve = r);
        }
      }
    } finally {
      this.removeEventListener('message', handler);
    }
  }
}
\`\`\`

### Offline Sync Worker (src/workers/sync.worker.js)
\`\`\`javascript
// Service Worker for offline sync
import { openDB } from 'idb';
import { nanoid } from 'nanoid';

const DB_NAME = 'editor-sync';
const STORE_NAME = 'pending-updates';

// Initialize database
const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: false
      });
      store.createIndex('timestamp', 'timestamp');
      store.createIndex('documentId', 'documentId');
    }
  }
});

// Queue for batching updates
class UpdateQueue {
  #updates = new Map();
  #flushTimer = null;
  
  add(documentId, update) {
    if (!this.#updates.has(documentId)) {
      this.#updates.set(documentId, []);
    }
    this.#updates.get(documentId).push(update);
    
    this.#scheduleFlush();
  }
  
  #scheduleFlush() {
    if (this.#flushTimer) return;
    
    this.#flushTimer = setTimeout(() => {
      this.flush();
      this.#flushTimer = null;
    }, 100);
  }
  
  async flush() {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    
    for (const [documentId, updates] of this.#updates) {
      await tx.store.add({
        id: nanoid(),
        documentId,
        updates,
        timestamp: Date.now(),
        retries: 0
      });
    }
    
    await tx.done;
    this.#updates.clear();
    
    // Trigger sync
    self.registration.sync.register('editor-sync');
  }
}

const queue = new UpdateQueue();

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'queue-update':
      queue.add(data.documentId, data.update);
      break;
      
    case 'get-pending':
      const db = await dbPromise;
      const pending = await db.getAllFromIndex(
        STORE_NAME,
        'documentId',
        data.documentId
      );
      event.ports[0].postMessage({ pending });
      break;
  }
});

// Background sync event
self.addEventListener('sync', async (event) => {
  if (event.tag === 'editor-sync') {
    event.waitUntil(syncPendingUpdates());
  }
});

async function syncPendingUpdates() {
  const db = await dbPromise;
  const updates = await db.getAll(STORE_NAME);
  
  for (const update of updates) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
      
      if (response.ok) {
        await db.delete(STORE_NAME, update.id);
      } else if (response.status >= 500) {
        // Server error, retry later
        update.retries++;
        if (update.retries < 5) {
          await db.put(STORE_NAME, update);
        } else {
          // Max retries reached, notify user
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'sync-failed',
                documentId: update.documentId
              });
            });
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      // Network error, will retry on next sync
    }
  }
}

// Periodic sync for long-running sessions
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'editor-periodic-sync') {
    event.waitUntil(syncPendingUpdates());
  }
});
\`\`\`

### Editor Integration (src/editor/Editor.js)
\`\`\`javascript
import { CRDTDocument } from './CRDTDocument.js';
import { WebRTCConnection } from '../network/WebRTCConnection.js';
import { PeerManager } from '../network/PeerManager.js';

export class CollaborativeEditor extends HTMLElement {
  #document;
  #peerManager;
  #syncWorker;
  #editorElement;
  #statusElement;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  async connectedCallback() {
    this.#render();
    await this.#initialize();
  }
  
  #render() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          height: 100%;
          position: relative;
        }
        
        #editor {
          width: 100%;
          height: calc(100% - 30px);
          border: 1px solid #ddd;
          padding: 1rem;
          font-family: monospace;
          white-space: pre-wrap;
          overflow-y: auto;
        }
        
        #status {
          height: 30px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          background: #f5f5f5;
          gap: 1rem;
        }
        
        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
        }
        
        .indicator.connected { background: #4caf50; }
        .indicator.syncing { background: #ff9800; }
        .indicator.offline { background: #f44336; }
        
        .cursor {
          position: absolute;
          width: 2px;
          background: var(--user-color);
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          50% { opacity: 0.5; }
        }
      </style>
      
      <div id="status">
        <div class="indicator" id="connection-status"></div>
        <span id="status-text">Initializing...</span>
        <span id="peer-count">0 peers</span>
      </div>
      <div id="editor" contenteditable="true" spellcheck="false"></div>
    \`;
    
    this.#editorElement = this.shadowRoot.querySelector('#editor');
    this.#statusElement = this.shadowRoot.querySelector('#status-text');
  }
  
  async #initialize() {
    const documentId = this.getAttribute('document-id');
    const userId = this.getAttribute('user-id');
    
    // Initialize CRDT document
    this.#document = new CRDTDocument(documentId, userId);
    
    // Initialize peer connections
    this.#peerManager = new PeerManager(documentId, userId);
    
    // Initialize sync worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register(
        '/src/workers/sync.worker.js',
        { type: 'module' }
      );
      this.#syncWorker = registration.active || registration.installing;
    }
    
    this.#setupEventHandlers();
    await this.#connectToPeers();
  }
  
  #setupEventHandlers() {
    // Local edits
    this.#editorElement.addEventListener('input', (event) => {
      const selection = this.shadowRoot.getSelection();
      const range = selection.getRangeAt(0);
      const offset = this.#getTextOffset(range.startContainer, range.startOffset);
      
      // This is a simplified version - real implementation would
      // properly handle all edit operations
      const newText = this.#editorElement.textContent;
      const oldText = this.#document.getText();
      
      // Calculate diff and apply to CRDT
      // ... diff calculation logic ...
    });
    
    // Document changes
    this.#document.addEventListener('textchange', (event) => {
      if (!event.detail.local) {
        this.#applyRemoteChanges(event.detail.delta);
      }
    });
    
    // Awareness changes (cursors)
    this.#document.addEventListener('awarenesschange', (event) => {
      this.#updateCursors(event.detail);
    });
    
    // Connection status
    this.#document.addEventListener('change', (event) => {
      if (event.detail.key === 'status') {
        this.#updateStatus(event.detail.newValue);
      }
    });
  }
  
  async #connectToPeers() {
    // Connect to signaling server
    await this.#peerManager.connect();
    
    // Handle peer connections
    this.#peerManager.on('peer-connected', async (peer) => {
      const connection = new WebRTCConnection(
        this.#peerManager.signaling,
        peer.id,
        peer.initiator
      );
      
      // Sync document state
      for await (const message of connection.messages()) {
        this.#document.applyUpdate(message);
      }
      
      // Send local updates
      this.#document.addEventListener('textchange', (event) => {
        if (event.detail.local) {
          connection.send(event.detail.update);
        }
      });
    });
    
    this.#updatePeerCount();
  }
  
  #applyRemoteChanges(delta) {
    // Apply changes to editor without triggering input events
    // ... implementation ...
  }
  
  #updateCursors(awareness) {
    // Update remote user cursors
    // ... implementation ...
  }
  
  #updateStatus(status) {
    this.#statusElement.textContent = status;
    const indicator = this.shadowRoot.querySelector('#connection-status');
    indicator.className = \`indicator \${status}\`;
  }
  
  #updatePeerCount() {
    const count = this.#peerManager.getPeerCount();
    this.shadowRoot.querySelector('#peer-count').textContent = 
      \`\${count} peer\${count !== 1 ? 's' : ''}\`;
  }
  
  #getTextOffset(node, offset) {
    // Calculate absolute text offset from DOM position
    // ... implementation ...
  }
}

// Register custom element
customElements.define('collaborative-editor', CollaborativeEditor);
\`\`\``,
      reasoning: 'This example showcases modern JavaScript with ES2024+ features including decorators, private fields, async iterators, top-level await, Web Components, WebRTC for P2P connections, CRDTs for conflict-free collaboration, Service Workers for offline sync, and IndexedDB for persistence.'
    }
  ]
};

export const typescriptPro: SpecialistDefinition = {
  name: 'typescript-pro',
  description: 'Expert TypeScript developer specializing in TypeScript 5.3+ features, advanced type system programming, and building type-safe architectures. Proficient in template literal types, satisfies operator, const type parameters, and cutting-edge TypeScript patterns for 2024-2025.',
  category: 'language',
  focusAreas: [
    'TypeScript 5.3+ features (const type parameters, using declarations)',
    'Advanced type system (conditional types, template literals, branded types)',
    'Type-level programming with mapped and recursive types',
    'Generic constraints and variance annotations',
    'Decorator metadata and parameter decorators',
    'Module augmentation and declaration merging',
    'Strict type checking and exhaustiveness',
    'Discriminated unions and pattern matching',
    'Type predicates and assertion functions',
    'Namespace and module patterns',
    'Build optimization with tsc and esbuild',
    'Monorepo setup with TypeScript references',
    'Type testing with tsd and expect-type',
    'Runtime type validation with zod/io-ts',
    'Advanced compiler API usage'
  ],
  approach: [
    'Design type-first APIs that prevent runtime errors',
    'Use const assertions and satisfies for precise types',
    'Leverage type inference to reduce boilerplate',
    'Create branded types for domain modeling',
    'Apply functional programming with type safety',
    'Use conditional types for flexible APIs',
    'Implement exhaustive pattern matching',
    'Generate runtime validators from types',
    'Write type-level unit tests',
    'Document complex types with JSDoc'
  ],
  outputs: [
    'Type-safe TypeScript libraries with zero runtime overhead',
    'Comprehensive type definitions (.d.ts files)',
    'Generic utility type libraries',
    'Type-safe API clients with full inference',
    'Monorepo configurations with project references',
    'Custom TypeScript transformers',
    'Type coverage reports and metrics',
    'Generated runtime validators',
    'Type-level testing suites',
    'Advanced tsconfig.json configurations'
  ],
  keyPrinciple: 'Types as a programming language: Design systems where invalid states are unrepresentable and correctness is verified at compile time through advanced type-level programming',
  examples: [
    {
      input: 'Build a type-safe SQL query builder with full type inference and runtime validation',
      output: `## Type-Safe SQL Query Builder (TypeScript 5.3+)

### Project Structure
\`\`\`
type-safe-sql/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── schema.ts
│   │   ├── query.ts
│   │   └── operators.ts
│   ├── builder/
│   │   ├── QueryBuilder.ts
│   │   ├── expressions.ts
│   │   └── validators.ts
│   └── runtime/
│       ├── executor.ts
│       └── sanitizer.ts
├── tests/
│   ├── type-tests.ts
│   └── runtime-tests.ts
└── examples/
    └── usage.ts
\`\`\`

### TypeScript Configuration
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ES2022",
    "lib": ["ES2023"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
\`\`\`

### Advanced Type System (src/types/schema.ts)
\`\`\`typescript
// Branded types for type safety
type Brand<K, T> = K & { __brand: T };

export type TableName<T extends string = string> = Brand<T, 'TableName'>;
export type ColumnName<T extends string = string> = Brand<T, 'ColumnName'>;
export type SqlValue = string | number | boolean | Date | null;

// Type-level schema definition
export interface Schema {
  [table: string]: {
    [column: string]: {
      type: SqlType;
      nullable?: boolean;
      primaryKey?: boolean;
      references?: { table: string; column: string };
    };
  };
}

// SQL type mapping with TypeScript types
export type SqlType = 
  | 'integer'
  | 'bigint'
  | 'text'
  | 'boolean'
  | 'timestamp'
  | 'uuid'
  | 'json';

// Type-level SQL to TypeScript type mapping
export type SqlToTs<T extends SqlType, Nullable extends boolean = false> =
  Nullable extends true
    ? SqlToTsNonNull<T> | null
    : SqlToTsNonNull<T>;

type SqlToTsNonNull<T extends SqlType> =
  T extends 'integer' ? number :
  T extends 'bigint' ? bigint :
  T extends 'text' ? string :
  T extends 'boolean' ? boolean :
  T extends 'timestamp' ? Date :
  T extends 'uuid' ? string :
  T extends 'json' ? unknown :
  never;

// Extract table type from schema
export type InferTable<
  S extends Schema,
  T extends keyof S
> = {
  [K in keyof S[T] as S[T][K]['nullable'] extends true ? K : never]?: SqlToTs<
    S[T][K]['type'],
    true
  >;
} & {
  [K in keyof S[T] as S[T][K]['nullable'] extends true ? never : K]: SqlToTs<
    S[T][K]['type'],
    false
  >;
};

// Select result type with joins
export type SelectResult<
  S extends Schema,
  T extends TableSelection<S>
> = UnionToIntersection<
  {
    [K in keyof T]: T[K] extends readonly (infer C)[]
      ? K extends keyof S
        ? { [Col in C as \`\${K & string}.\${Col & string}\`]: 
            Col extends keyof S[K] 
              ? SqlToTs<S[K][Col]['type'], S[K][Col]['nullable'] extends true ? true : false>
              : never
          }
        : never
      : never;
  }[keyof T]
>;

// Helper types
type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type TableSelection<S extends Schema> = {
  [K in keyof S]?: ReadonlyArray<keyof S[K]>;
};
\`\`\`

### Query Builder with Type Inference (src/builder/QueryBuilder.ts)
\`\`\`typescript
import { Schema, InferTable, SelectResult, TableName, ColumnName } from '../types/schema';
import { WhereCondition, OrderBy, JoinType } from '../types/query';
import { validateQuery } from './validators';

// Const type parameter for schema inference
export class QueryBuilder<const S extends Schema> {
  private schema: S;
  
  constructor(schema: S) {
    this.schema = schema;
  }
  
  // Select with full type inference
  select<
    const T extends TableName<Extract<keyof S, string>>,
    const C extends ReadonlyArray<keyof S[T]>
  >(table: T, columns: C) {
    return new SelectQuery<S, T, C>(this.schema, table, columns);
  }
  
  // Insert with type checking
  insert<T extends keyof S>(
    table: T,
    data: InferTable<S, T>
  ) {
    return new InsertQuery<S, T>(this.schema, table, data);
  }
  
  // Update with partial type safety
  update<T extends keyof S>(
    table: T,
    data: Partial<InferTable<S, T>>
  ) {
    return new UpdateQuery<S, T>(this.schema, table, data);
  }
  
  // Type-safe delete
  delete<T extends keyof S>(table: T) {
    return new DeleteQuery<S, T>(this.schema, table);
  }
}

// Select query with method chaining
class SelectQuery<
  S extends Schema,
  T extends keyof S,
  C extends ReadonlyArray<keyof S[T]>,
  J extends TableSelection<S> = { [K in T]: C }
> {
  private schema: S;
  private table: T;
  private columns: C;
  private joins: Array<JoinClause<S>> = [];
  private whereClauses: Array<WhereCondition> = [];
  private orderByClauses: Array<OrderBy> = [];
  private limitValue?: number;
  private offsetValue?: number;
  
  constructor(schema: S, table: T, columns: C) {
    this.schema = schema;
    this.table = table;
    this.columns = columns;
  }
  
  // Type-safe joins with inference
  join<
    JT extends keyof S,
    JC extends ReadonlyArray<keyof S[JT]>
  >(
    type: JoinType,
    table: JT,
    columns: JC,
    on: JoinCondition<S, T, JT>
  ): SelectQuery<S, T, C, J & { [K in JT]: JC }> {
    this.joins.push({ type, table, columns, on });
    return this as any;
  }
  
  // Where clause with type checking
  where<K extends keyof S[T]>(
    column: K,
    operator: ComparisonOperator,
    value: SqlToTs<S[T][K]['type'], S[T][K]['nullable'] extends true ? true : false>
  ): this {
    this.whereClauses.push({ column: column as string, operator, value });
    return this;
  }
  
  // Advanced where with template literals
  whereRaw<const Expr extends string>(
    expr: ValidateWhereExpression<Expr, S, T>
  ): this {
    // Runtime validation
    validateQuery.whereExpression(expr, this.schema, this.table);
    this.whereClauses.push({ raw: expr });
    return this;
  }
  
  // Order by with column validation
  orderBy<K extends keyof S[T]>(
    column: K,
    direction: 'ASC' | 'DESC' = 'ASC'
  ): this {
    this.orderByClauses.push({ 
      column: column as string, 
      direction 
    });
    return this;
  }
  
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }
  
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }
  
  // Build SQL with parameterization
  build(): { sql: string; params: unknown[]; _result: SelectResult<S, J> } {
    const params: unknown[] = [];
    let sql = 'SELECT ';
    
    // Build column list
    const columnList = this.columns.map(col => 
      \`\${this.table as string}.\${col as string}\`
    );
    
    // Add join columns
    for (const join of this.joins) {
      const joinColumns = (join.columns as string[]).map(col =>
        \`\${join.table as string}.\${col}\`
      );
      columnList.push(...joinColumns);
    }
    
    sql += columnList.join(', ');
    sql += \` FROM \${this.table as string}\`;
    
    // Add joins
    for (const join of this.joins) {
      sql += \` \${join.type} JOIN \${join.table as string}\`;
      sql += \` ON \${join.on.left} = \${join.on.right}\`;
    }
    
    // Add where clauses
    if (this.whereClauses.length > 0) {
      sql += ' WHERE ';
      const conditions = this.whereClauses.map((clause, i) => {
        if ('raw' in clause) {
          return clause.raw;
        }
        params.push(clause.value);
        return \`\${clause.column} \${clause.operator} $\${params.length}\`;
      });
      sql += conditions.join(' AND ');
    }
    
    // Add order by
    if (this.orderByClauses.length > 0) {
      sql += ' ORDER BY ';
      sql += this.orderByClauses
        .map(o => \`\${o.column} \${o.direction}\`)
        .join(', ');
    }
    
    // Add limit/offset
    if (this.limitValue !== undefined) {
      sql += \` LIMIT \${this.limitValue}\`;
    }
    if (this.offsetValue !== undefined) {
      sql += \` OFFSET \${this.offsetValue}\`;
    }
    
    return { 
      sql, 
      params,
      _result: {} as SelectResult<S, J>
    };
  }
}

// Type-safe join conditions
type JoinCondition<
  S extends Schema,
  T1 extends keyof S,
  T2 extends keyof S
> = {
  left: \`\${T1 & string}.\${keyof S[T1] & string}\`;
  right: \`\${T2 & string}.\${keyof S[T2] & string}\`;
};

// Join clause type
interface JoinClause<S extends Schema> {
  type: JoinType;
  table: keyof S;
  columns: ReadonlyArray<string>;
  on: { left: string; right: string };
}

// Comparison operators
type ComparisonOperator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN';

// Validate WHERE expression at type level
type ValidateWhereExpression<
  Expr extends string,
  S extends Schema,
  T extends keyof S
> = Expr extends \`\${infer Col} \${infer Op} \${infer _}\`
  ? Col extends keyof S[T]
    ? Op extends ComparisonOperator
      ? Expr
      : \`Invalid operator: \${Op}\`
    : \`Unknown column: \${Col}\`
  : 'Invalid WHERE expression';
\`\`\`

### Runtime Validation (src/builder/validators.ts)
\`\`\`typescript
import { z } from 'zod';
import { Schema } from '../types/schema';

// Runtime validators generated from schema
export class QueryValidator<S extends Schema> {
  constructor(private schema: S) {}
  
  // Generate Zod schema from table schema
  generateTableValidator<T extends keyof S>(table: T) {
    const columns = this.schema[table];
    const shape: Record<string, z.ZodType> = {};
    
    for (const [col, config] of Object.entries(columns)) {
      let validator: z.ZodType;
      
      switch (config.type) {
        case 'integer':
          validator = z.number().int();
          break;
        case 'bigint':
          validator = z.bigint();
          break;
        case 'text':
          validator = z.string();
          break;
        case 'boolean':
          validator = z.boolean();
          break;
        case 'timestamp':
          validator = z.date();
          break;
        case 'uuid':
          validator = z.string().uuid();
          break;
        case 'json':
          validator = z.unknown();
          break;
      }
      
      if (config.nullable) {
        validator = validator.nullable();
      }
      
      shape[col] = validator;
    }
    
    return z.object(shape);
  }
  
  // Validate WHERE expression
  validateWhereExpression(expr: string, table: keyof S) {
    const columns = Object.keys(this.schema[table]);
    const operators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN'];
    
    // Simple validation - real implementation would use proper parser
    const match = expr.match(/^(\w+)\s+(\S+)\s+(.+)$/);
    if (!match) {
      throw new Error('Invalid WHERE expression format');
    }
    
    const [, column, operator] = match;
    
    if (!columns.includes(column)) {
      throw new Error(\`Unknown column: \${column}\`);
    }
    
    if (!operators.includes(operator)) {
      throw new Error(\`Invalid operator: \${operator}\`);
    }
  }
}

export const validateQuery = {
  whereExpression<S extends Schema>(
    expr: string,
    schema: S,
    table: keyof S
  ) {
    const validator = new QueryValidator(schema);
    validator.validateWhereExpression(expr, table);
  }
};
\`\`\`

### Type-Level Tests (tests/type-tests.ts)
\`\`\`typescript
import { expectType, expectError } from 'tsd';
import { QueryBuilder } from '../src';

// Define test schema
const schema = {
  users: {
    id: { type: 'integer' as const, primaryKey: true },
    name: { type: 'text' as const },
    email: { type: 'text' as const },
    created_at: { type: 'timestamp' as const },
    deleted_at: { type: 'timestamp' as const, nullable: true }
  },
  posts: {
    id: { type: 'integer' as const, primaryKey: true },
    user_id: { type: 'integer' as const, references: { table: 'users', column: 'id' } },
    title: { type: 'text' as const },
    content: { type: 'text' as const },
    published: { type: 'boolean' as const }
  }
} as const;

const qb = new QueryBuilder(schema);

// Test: Select with type inference
const query1 = qb.select('users', ['id', 'name', 'email']);
const result1 = query1.build();

expectType<{
  'users.id': number;
  'users.name': string;
  'users.email': string;
}>(result1._result);

// Test: Join with type inference
const query2 = qb
  .select('users', ['id', 'name'])
  .join('INNER', 'posts', ['title', 'published'], {
    left: 'users.id',
    right: 'posts.user_id'
  });

const result2 = query2.build();

expectType<{
  'users.id': number;
  'users.name': string;
  'posts.title': string;
  'posts.published': boolean;
}>(result2._result);

// Test: Where clause type checking
const query3 = qb
  .select('users', ['id'])
  .where('created_at', '>', new Date());

// This should error - wrong type
expectError(
  qb.select('users', ['id']).where('created_at', '>', 'not a date')
);

// Test: Insert type checking
const insert1 = qb.insert('users', {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  created_at: new Date(),
  deleted_at: null // nullable field
});

// This should error - missing required field
expectError(
  qb.insert('users', {
    id: 1,
    name: 'John'
    // missing email and created_at
  })
);

// Test: Raw where validation
const query4 = qb
  .select('users', ['id'])
  .whereRaw('email LIKE "%@example.com"');

// This should show type error for invalid column
expectError(
  qb.select('users', ['id']).whereRaw('invalid_column = 1')
);
\`\`\`

### Usage Example
\`\`\`typescript
import { QueryBuilder } from './src';
import { Pool } from 'pg';

// Define your schema with const assertion
const dbSchema = {
  users: {
    id: { type: 'integer' as const, primaryKey: true },
    email: { type: 'text' as const },
    name: { type: 'text' as const },
    role: { type: 'text' as const },
    created_at: { type: 'timestamp' as const }
  },
  orders: {
    id: { type: 'integer' as const, primaryKey: true },
    user_id: { type: 'integer' as const, references: { table: 'users', column: 'id' } },
    total: { type: 'integer' as const },
    status: { type: 'text' as const },
    created_at: { type: 'timestamp' as const }
  }
} as const;

// Create query builder
const qb = new QueryBuilder(dbSchema);
const pool = new Pool();

// Type-safe queries with full inference
async function getUserOrders(userId: number) {
  const query = qb
    .select('users', ['id', 'name', 'email'])
    .join('LEFT', 'orders', ['id', 'total', 'status'], {
      left: 'users.id',
      right: 'orders.user_id'
    })
    .where('users.id', '=', userId)
    .orderBy('orders.created_at', 'DESC')
    .limit(10);
  
  const { sql, params } = query.build();
  const result = await pool.query(sql, params);
  
  // Result is fully typed!
  return result.rows.map(row => ({
    userId: row['users.id'],
    userName: row['users.name'],
    userEmail: row['users.email'],
    orderId: row['orders.id'],
    orderTotal: row['orders.total'],
    orderStatus: row['orders.status']
  }));
}

// Type-safe inserts
async function createUser(email: string, name: string) {
  const query = qb.insert('users', {
    id: Date.now(), // Would use proper ID generation
    email,
    name,
    role: 'user',
    created_at: new Date()
  });
  
  const { sql, params } = query.build();
  return pool.query(sql, params);
}

// Complex type-safe query
async function getActiveUsersWithRecentOrders() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const query = qb
    .select('users', ['id', 'name', 'email'])
    .join('INNER', 'orders', ['id', 'total'], {
      left: 'users.id',
      right: 'orders.user_id'
    })
    .where('orders.created_at', '>', thirtyDaysAgo)
    .where('orders.status', '=', 'completed')
    .orderBy('orders.total', 'DESC');
  
  const { sql, params } = query.build();
  return pool.query(sql, params);
}
\`\`\``,
      reasoning: 'This example demonstrates advanced TypeScript 5.3+ features including const type parameters, template literal types, conditional types, branded types, type-level validation, runtime type generation with Zod, and comprehensive type inference for a SQL query builder that prevents SQL errors at compile time.'
    }
  ]
};

// Register all language specialists
export function registerLanguageSpecialists(): void {
  specialistRegistry.register(pythonPro);
  specialistRegistry.register(rustPro);
  specialistRegistry.register(golangPro);
  specialistRegistry.register(javascriptPro);
  specialistRegistry.register(typescriptPro);
}