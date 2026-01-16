# Stage 1 Implementation Notes

## What Was Built

### Presentation Plane (IDE)
- **VS Code Fork**: Successfully forked and branded as "GraphIDE"
- **Build Requirements**:
  - Node.js v22.21.1 (exact version required)
  - Visual Studio Build Tools 2022 with Spectre-mitigated libraries
  - Python 3.10+ with setuptools
- **GraphIDE Panel**: Native ViewPane in Auxiliary Bar
  - Location: `ide/src/vs/workbench/contrib/graphide/browser/`
  - Uses VS Code's `IRequestService` for CSP-safe HTTP requests

### Control Plane (Backend Stub)
- **FastAPI Server**: Minimal stub at `agent-runtime/main.py`
- **Endpoint**: `POST /agent/request`
- **Response**: Returns dummy structured response per IPC schema

### IPC Implementation
- **Protocol**: HTTP REST (POST requests)
- **Format**: JSON following Stage 0 schemas
- **Data Captured**:
  - `intent`: Always "free_text" for now
  - `filePath`: Active editor file path
  - `language`: Detected language ID
  - `codeRange`: Selected lines (if any)
  - `userQuery`: User's message text

### Error Handling
- Backend offline → Graceful error message with instructions
- Async requests → `IRequestService` is non-blocking
- All errors caught → Displayed in panel, never crashes IDE

## Key Files

| File | Purpose |
|------|---------|
| `ide/product.json` | Branding configuration |
| `ide/src/vs/workbench/contrib/graphide/browser/graphide.contribution.ts` | Panel registration |
| `ide/src/vs/workbench/contrib/graphide/browser/graphideViewPane.ts` | Panel UI & IPC logic |
| `ide/src/vs/workbench/workbench.common.main.ts` | Import registration |
| `agent-runtime/main.py` | FastAPI backend stub |

## Build Commands

```bash
# First-time setup
cd ide
npm install          # ~10-15 min
npm run compile      # ~15-20 min

# After code changes
npm run compile      # Incremental, faster

# Launch IDE
.\scripts\code.bat   # Windows
```

## Known Limitations (Stage 1)

1. **No persistence**: Chat history lost on panel close
2. **No markdown rendering**: System responses displayed as plain text
3. **Single backend endpoint**: All requests go to same stub
4. **No authentication**: Localhost only, no security layer

## Stage 2 Readiness Checklist

- [x] IDE can send structured JSON to backend
- [x] Backend can parse requests and return structured responses
- [x] IDE can display backend responses
- [ ] Joern integration for CPG queries
- [ ] Local LLM for intelligent responses
- [ ] FAISS for RAG lookup
