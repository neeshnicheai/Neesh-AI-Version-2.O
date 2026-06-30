# Neesh AI Backend

Enterprise-grade RAG-powered AI chatbot backend with semantic search capabilities.

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL (Supabase)

### Environment Setup

1. **Copy environment templates:**
```bash
cp .env.example .env
cp ai-service/.env.example ai-service/.env
```

2. **Configure your credentials** in both `.env` files:
   - Supabase database URL and credentials
   - OpenAI API key for embeddings
   - Gemini API key for chat responses

### Running the Application

1. **Start AI Service:**
```bash
cd ai-service
npm install
npm run build
npm start
```

2. **Start Spring Boot Backend:**
```bash
mvn spring-boot:run
```

## 🏗️ Architecture

- **Spring Boot Backend (Port 8081)**: REST API, authentication, document management
- **Node.js AI Service (Port 3000)**: RAG pipeline, embeddings, chat processing
- **Supabase**: PostgreSQL with pgvector for vector storage

## 📊 RAG Pipeline Features

- ✅ Semantic reranking with cosine similarity
- ✅ Multi-layer caching (response, retrieval, embedding)
- ✅ RAG Triad evaluation metrics
- ✅ Query expansion with LLM paraphrasing
- ✅ Hybrid search (vector + keyword)
- ✅ Production analytics endpoints

## 🔐 Security

- Environment variables for all sensitive data
- JWT authentication with Supabase
- Rate limiting and input validation
- CORS protection with explicit origins

## 📈 Production Ready

- HikariCP connection pooling (50 max connections)
- Tomcat optimization (400 threads, 2000 connections)
- Health monitoring with Spring Actuator
- Comprehensive error handling and fallbacks
- Cost-optimized with intelligent caching

## API Documentation

- Swagger UI: `http://localhost:8081/swagger-ui.html`
- Health Check: `http://localhost:8081/actuator/health`
- RAG Analytics: `http://localhost:3000/internal/rag-analytics/global`

## Environment Variables

See `.env.example` for complete configuration options including:
- Database credentials
- API keys (OpenAI, Gemini)
- Service URLs and ports
- Security settings