import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Python Backend Expert with FastAPI, SQLModel, and Modern Patterns

export const pythonBackendExpert: SpecialistDefinition = {
  name: 'python-backend-expert',
  description: 'Expert Python backend developer specializing in FastAPI, Django, SQLModel, and async patterns. Proficient in Pydantic v2, SQLAlchemy 2.0+, modern Python 3.11+ features, and production-ready API development with type safety and performance optimization.',
  category: 'development',
  focusAreas: [
    'FastAPI with async/await patterns and dependency injection',
    'SQLModel ORM with Pydantic v2 and SQLAlchemy 2.0+',
    'Django 5.0+ with async views and modern patterns',
    'Type-safe API development with Python type hints',
    'Async database operations with asyncpg and databases',
    'Alembic migrations with async SQLModel support',
    'Pydantic v2 performance optimizations and validators',
    'Background tasks with Celery, RQ, or FastAPI BackgroundTasks',
    'API testing with pytest-asyncio and httpx',
    'OpenAPI/AsyncAPI documentation generation',
    'Authentication with JWT, OAuth2, and session management',
    'WebSocket support for real-time features',
    'Performance optimization with uvloop and orjson',
    'Container deployment with uvicorn and gunicorn'
  ],
  approaches: [
    'Design type-safe APIs using Pydantic models and Python type hints',
    'Implement async/await throughout the stack for non-blocking I/O',
    'Use SQLModel to reduce code duplication between ORM and API models',
    'Apply dependency injection for clean, testable code architecture',
    'Leverage FastAPI automatic documentation generation',
    'Implement proper error handling with custom exception handlers',
    'Use background tasks for long-running operations',
    'Apply database connection pooling for optimal performance',
    'Write comprehensive tests with pytest and async fixtures',
    'Monitor performance with APM tools and structured logging'
  ],
  outputs: [
    'Type-safe FastAPI applications with full OpenAPI documentation',
    'SQLModel schemas with Pydantic v2 validators',
    'Async database queries with proper connection management',
    'Comprehensive test suites with async test patterns',
    'Alembic migration scripts for database versioning',
    'Docker configurations for production deployment',
    'API client SDKs generated from OpenAPI specs',
    'Performance benchmarks and optimization reports',
    'Security implementations with modern auth patterns',
    'WebSocket implementations for real-time features'
  ],
  subagentType: 'python-backend-expert',
  keyPrinciple: 'Build high-performance, type-safe Python APIs leveraging modern async patterns, FastAPI, SQLModel, and Pydantic v2 for production-ready applications with excellent developer experience',
  
  examples: [
    {
      input: 'Create a FastAPI application with SQLModel, async database operations, and Pydantic v2',
      output: `## Modern FastAPI + SQLModel + Async Setup (2024)

### Project Structure
\`\`\`
app/
├── __init__.py
├── main.py
├── config.py
├── database.py
├── models/
│   ├── __init__.py
│   └── user.py
├── api/
│   ├── __init__.py
│   ├── deps.py
│   └── v1/
│       ├── __init__.py
│       └── users.py
├── schemas/
│   ├── __init__.py
│   └── user.py
└── tests/
    └── test_users.py
\`\`\`

### Configuration (config.py)
\`\`\`python
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://user:pass@localhost/db"
    )
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Modern FastAPI App"
    
    # Security
    secret_key: str = Field(..., min_length=32)
    access_token_expire_minutes: int = 30
    
    # Performance
    connection_pool_size: int = 20
    connection_max_overflow: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
\`\`\`

### Database Setup (database.py)
\`\`\`python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from typing import AsyncGenerator
import contextlib

from app.config import settings

# Create async engine with connection pooling
engine = create_async_engine(
    str(settings.database_url),
    echo=False,
    future=True,
    pool_size=settings.connection_pool_size,
    max_overflow=settings.connection_max_overflow,
    pool_pre_ping=True,  # Verify connections before use
)

# Async session factory
async_session_maker = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

# Lifespan context manager for app
@contextlib.asynccontextmanager
async def lifespan(app):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield
    
    # Shutdown
    await engine.dispose()
\`\`\`

### SQLModel with Pydantic v2 (models/user.py)
\`\`\`python
from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import uuid

class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # Pydantic v2 configuration
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        from_attributes=True
    )
    
    @field_validator('email')
    @classmethod
    def email_to_lower(cls, v: str) -> str:
        return v.lower()

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )
    
    # Relationships
    posts: List["Post"] = Relationship(back_populates="author")

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserUpdate(SQLModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
\`\`\`

### API Endpoints (api/v1/users.py)
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.database import get_session
from app.models.user import User, UserCreate, UserUpdate, UserResponse
from app.api.deps import get_current_user, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    session: AsyncSession = Depends(get_session),
    user_in: UserCreate
) -> User:
    """Create new user with proper async handling."""
    # Check if user exists
    statement = select(User).where(User.email == user_in.email)
    existing_user = await session.exec(statement)
    if existing_user.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User.model_validate(
        user_in.model_dump(exclude={"password"}),
        update={"hashed_password": get_password_hash(user_in.password)}
    )
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user

@router.get("/", response_model=List[UserResponse])
async def list_users(
    *,
    session: AsyncSession = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
) -> List[User]:
    """List users with pagination and filtering."""
    statement = select(User)
    
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    
    statement = statement.offset(skip).limit(limit)
    
    result = await session.exec(statement)
    return result.all()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    *,
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
) -> User:
    """Get user by ID with proper error handling."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    *,
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
) -> User:
    """Update user with partial data."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    *,
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
) -> None:
    """Delete user (soft delete by setting is_active=False)."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    session.add(user)
    await session.commit()
\`\`\`

### Main Application (main.py)
\`\`\`python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvloop
import asyncio

from app.config import settings
from app.database import lifespan
from app.api.v1 import users

# Use uvloop for better async performance
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# Create app with lifespan events
app = FastAPI(
    title=settings.project_name,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=settings.api_v1_prefix)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
\`\`\`

### Testing with Pytest-asyncio (tests/test_users.py)
\`\`\`python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.user import User, UserCreate

@pytest.mark.asyncio
async def test_create_user(async_client: AsyncClient):
    user_data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "StrongPass123"
    }
    
    response = await async_client.post(
        "/api/v1/users/",
        json=user_data
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert "password" not in data
    assert "hashed_password" not in data
\`\`\`

### Run with Uvicorn
\`\`\`bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
\`\`\``,
      reasoning: 'This example demonstrates modern FastAPI development with SQLModel, Pydantic v2, async/await patterns, proper project structure, type safety, and production-ready configurations including testing and deployment.'
    },
    {
      input: 'Show me advanced FastAPI patterns with background tasks, WebSockets, and caching',
      output: `## Advanced FastAPI Patterns (2024)

### 1. Background Tasks with Multiple Approaches

\`\`\`python
from fastapi import BackgroundTasks, Depends
from celery import Celery
from typing import Optional
import asyncio
import aioredis

# Celery setup for heavy tasks
celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Redis for caching
redis_pool = None

async def get_redis():
    global redis_pool
    if not redis_pool:
        redis_pool = await aioredis.create_redis_pool(
            'redis://localhost:6379',
            encoding='utf-8'
        )
    return redis_pool

# 1. FastAPI Built-in Background Tasks
@router.post("/send-notification/")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session)
):
    # Quick background task
    background_tasks.add_task(
        send_email_notification,
        email,
        "Welcome to our platform!"
    )
    
    # Return immediately
    return {"message": "Notification queued"}

async def send_email_notification(email: str, message: str):
    # Simulate email sending
    await asyncio.sleep(2)
    print(f"Email sent to {email}: {message}")

# 2. Celery for Heavy Processing
@celery_app.task
def process_large_dataset(dataset_id: str):
    # Heavy computation
    import time
    time.sleep(60)  # Simulate long processing
    return f"Processed dataset {dataset_id}"

@router.post("/process-dataset/")
async def trigger_processing(dataset_id: str):
    # Queue to Celery
    task = process_large_dataset.delay(dataset_id)
    
    return {
        "task_id": task.id,
        "status": "queued",
        "check_status_at": f"/tasks/{task.id}"
    }

@router.get("/tasks/{task_id}")
async def check_task_status(task_id: str):
    task = celery_app.AsyncResult(task_id)
    
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.ready() else None
    }
\`\`\`

### 2. WebSocket Implementation with Rooms

\`\`\`python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        # Room-based connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_rooms: Dict[WebSocket, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        
        # Add to room
        if room not in self.active_connections:
            self.active_connections[room] = set()
        self.active_connections[room].add(websocket)
        
        # Track user's rooms
        if websocket not in self.user_rooms:
            self.user_rooms[websocket] = set()
        self.user_rooms[websocket].add(room)
        
        # Notify others in room
        await self.broadcast_to_room(
            room,
            {"type": "user_joined", "room": room},
            exclude=websocket
        )
    
    def disconnect(self, websocket: WebSocket):
        # Remove from all rooms
        if websocket in self.user_rooms:
            for room in self.user_rooms[websocket]:
                self.active_connections[room].discard(websocket)
                if not self.active_connections[room]:
                    del self.active_connections[room]
            del self.user_rooms[websocket]
    
    async def broadcast_to_room(
        self, 
        room: str, 
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                if connection != exclude:
                    await connection.send_json(message)
    
    async def send_personal_message(
        self, 
        message: dict, 
        websocket: WebSocket
    ):
        await websocket.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str,
    token: Optional[str] = None
):
    # Authenticate WebSocket connection
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=4401, reason="Unauthorized")
        return
    
    await manager.connect(websocket, room_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Process different message types
            if data["type"] == "chat_message":
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "chat_message",
                        "user": user.username,
                        "message": data["message"],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            elif data["type"] == "typing":
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "user_typing",
                        "user": user.username
                    },
                    exclude=websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_to_room(
            room_id,
            {"type": "user_left", "user": user.username}
        )
\`\`\`

### 3. Advanced Caching Patterns

\`\`\`python
from functools import wraps
import hashlib
import pickle
from typing import Optional, Any
import asyncio

class CacheManager:
    def __init__(self, redis_pool):
        self.redis = redis_pool
        self.default_ttl = 3600  # 1 hour
    
    def cache_key_wrapper(self, prefix: str):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_cache_key(
                    prefix, 
                    func.__name__, 
                    args, 
                    kwargs
                )
                
                # Try to get from cache
                cached = await self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Cache result
                await self.set(cache_key, result)
                
                return result
            return wrapper
        return decorator
    
    def _generate_cache_key(
        self, 
        prefix: str, 
        func_name: str, 
        args: tuple, 
        kwargs: dict
    ) -> str:
        # Create unique key from function and arguments
        key_data = f"{prefix}:{func_name}:{str(args)}:{str(sorted(kwargs.items()))}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        if value:
            return pickle.loads(value.encode('latin-1'))
        return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ):
        serialized = pickle.dumps(value).decode('latin-1')
        await self.redis.setex(
            key, 
            ttl or self.default_ttl, 
            serialized
        )
    
    async def invalidate(self, pattern: str):
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

# Usage
cache_manager = CacheManager(redis_pool)

@router.get("/products/{product_id}")
@cache_manager.cache_key_wrapper("product")
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_session)
):
    # This will be cached automatically
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404)
    return product

# Cache invalidation
@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    session: AsyncSession = Depends(get_session)
):
    # Update product
    product = await session.get(Product, product_id)
    # ... update logic ...
    
    # Invalidate cache
    await cache_manager.invalidate(f"product:get_product:*{product_id}*")
    
    return product
\`\`\`

### 4. Rate Limiting with Redis

\`\`\`python
from datetime import datetime, timedelta
import time

class RateLimiter:
    def __init__(self, redis_pool):
        self.redis = redis_pool
    
    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, dict]:
        current_time = time.time()
        window_start = current_time - window_seconds
        
        # Remove old entries
        await self.redis.zremrangebyscore(
            key, 
            0, 
            window_start
        )
        
        # Count requests in window
        request_count = await self.redis.zcard(key)
        
        if request_count >= max_requests:
            # Get oldest request time
            oldest = await self.redis.zrange(
                key, 
                0, 
                0, 
                withscores=True
            )
            
            if oldest:
                reset_time = oldest[0][1] + window_seconds
                return False, {
                    "limit": max_requests,
                    "remaining": 0,
                    "reset": int(reset_time)
                }
        
        # Add current request
        await self.redis.zadd(key, {str(current_time): current_time})
        await self.redis.expire(key, window_seconds)
        
        return True, {
            "limit": max_requests,
            "remaining": max_requests - request_count - 1,
            "reset": int(current_time + window_seconds)
        }

# Rate limit dependency
async def rate_limit_check(
    request: Request,
    redis: aioredis.Redis = Depends(get_redis)
):
    limiter = RateLimiter(redis)
    
    # Use IP or user ID as key
    key = f"rate_limit:{request.client.host}"
    
    allowed, headers = await limiter.check_rate_limit(
        key,
        max_requests=100,
        window_seconds=3600  # 1 hour
    )
    
    # Set headers
    request.state.rate_limit_headers = headers
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(headers["limit"]),
                "X-RateLimit-Remaining": str(headers["remaining"]),
                "X-RateLimit-Reset": str(headers["reset"])
            }
        )

# Apply to routes
@router.get("/api/data", dependencies=[Depends(rate_limit_check)])
async def get_data():
    return {"data": "This endpoint is rate limited"}
\`\`\`

### 5. Server-Sent Events (SSE)

\`\`\`python
from fastapi import Request
from sse_starlette.sse import EventSourceResponse
import asyncio

@router.get("/events")
async def event_stream(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    async def event_generator():
        # Subscribe to events for this user
        pubsub = await get_redis_pubsub()
        await pubsub.subscribe(f"user:{current_user.id}:events")
        
        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                # Get message from pubsub
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )
                
                if message:
                    yield {
                        "event": "update",
                        "data": message["data"],
                        "id": str(uuid.uuid4()),
                        "retry": 30000
                    }
                
                # Heartbeat
                yield {
                    "event": "ping",
                    "data": "keepalive"
                }
                
                await asyncio.sleep(30)
                
        finally:
            await pubsub.unsubscribe()
    
    return EventSourceResponse(event_generator())

# Publish events
async def publish_user_event(user_id: str, event_data: dict):
    redis = await get_redis()
    await redis.publish(
        f"user:{user_id}:events",
        json.dumps(event_data)
    )
\`\`\``,
      reasoning: 'This example showcases advanced FastAPI patterns including multiple background task approaches, WebSocket rooms, sophisticated caching with Redis, rate limiting, and Server-Sent Events, demonstrating production-ready patterns for 2024.'
    }
  ]
};

// Register the Python Backend specialist
export function registerPythonBackendSpecialist(): void {
  specialistRegistry.register(pythonBackendExpert);
}