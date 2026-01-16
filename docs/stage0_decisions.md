# Stage 0 Decisions & Constraints

## Technology Lock

The following technologies are explicitly chosen and locked for this project.

### 1. Presentation Plane (IDE)
- **Technology**: VS Code (Open Source Fork)
- **Language**: TypeScript / Electron
- **Reason**: Standard, extensible, robust plugin ecosystem.

### 2. Control & Cognition Plane (Backend)
- **Technology**: Python 3.10+
- **Framework**: FastAPI
- **Reason**: Rich AI ecosystem (PyTorch, LangChain, etc.), strong typing.

### 3. Knowledge Plane (Static Analysis)
- **Technology**: Joern
- **Format**: Code Property Graph (CPG)
- **Reason**: Industry standard for semantic code analysis (AST+CFG+PDG).

### 4. Knowledge Plane (RAG)
- **Technology**: FAISS + Local Embeddings (e.g., all-MiniLM-L6-v2)
- **Dataset**: Local CVE database (JSON/SQLite).
- **Reason**: High performance, completely offline capable.

### 5. AI Models
- **Technology**: Open-Weights LLM (e.g., Llama 3, Mistral)
- **Deployment**: Local inference (Ollama or standard GGUF runner).
- **Constraint**: **NO CLOUD APIs** (OpenAI, Anthropic, etc.). System must work offline.

## IPC Contracts
- **Protocol**: HTTP (REST) for unary requests, WebSocket for streams.
- **Format**: strictly typed JSON.
- **Validation**: JSON Schema enforced on both ends.

## Non-Goals for Stage 0

1.  **NO VS Code Forking**: We will *not* actually fork the repo in Stage 0. We just create the directory `ide/` as a placeholder.
2.  **NO Agent Implementation**: We will *not* write any Python agent code.
3.  **NO Joern Integration**: We will *not* install or run Joern yet.
4.  **NO AI**: We will *not* download or invoke any LLMs.
5.  **NO UI**: We will *not* build any React/Webview components.

## Security Assumptions
- **Single User**: The system runs locally for one developer.
- **Localhost**: All IPC happens over `127.0.0.1`.
- **Trust**: The user trusts their own installed agents.
