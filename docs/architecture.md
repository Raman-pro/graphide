# GraphIDE Architecture

## Overview

GraphIDE implements a **4-Plane Architecture** designed to separate concerns between the presentation layer (IDE), the agentic control layer, the individual agents, and the underlying knowledge graph.

## The 4 Planes

### 1. Presentation Plane (The IDE)
**Component**: Forked VS Code (Electron/TypeScript)
**Responsibility**:
- Renders the UI to the user.
- Captures user intent (edits, commands, selections).
- Forwards complex requests to the Control Plane.
- Applies patches and state changes received from the Control Plane.
- **Constraint**: No "heavy" AI logic resides here. It is a dumb terminal for the agents.

### 2. Control Plane (The Governor)
**Component**: Agent Runtime (Python/FastAPI) - *Meta-Agent*
**Responsibility**:
- Receives high-level intents from the IDE.
- Orchestrates the execution of Cognition Plane agents.
- Manages the "Context Window" and global state.
- Arbitrates conflicts between agents.
- Validates patches before sending them back to the IDE.

### 3. Cognition Plane (The Agents)
**Component**: Agent Runtime (Python) - *Sub-Agents*
**Responsibility**:
- Specialized agents for specific tasks (e.g., "Refactoring Agent", "Security Agent", "Test Agent").
- Operate on the Knowledge Plane (CPG) and RAG.
- deterministic outputs given the same context and CPG state.
- **Constraint**: Agents do NOT talk to the IDE directly; they talk to the Control Plane.

### 4. Knowledge Plane (The Brain)
**Component**: Joern (CPG) + FAISS (RAG)
**Responsibility**:
- **Code Property Graph (CPG)**: Provides a semantic graph representation of the code (AST, CFG, PDG).
- **RAG**: Vector database for unstructured data (docs, CVEs, historical patterns).
- source of truth for all agents.

## Data Flow

1.  **User Action**: User highlights code in IDE -> `Request(intent="explain", selection=...)` -> Control Plane.
2.  **Orchestration**: Control Plane analyzes intent -> spawning `ExplainerAgent`.
3.  **Reasoning**: `ExplainerAgent` queries Knowledge Plane (CPG for call graph, RAG for docs).
4.  **Response**: `ExplainerAgent` generates explanation -> Control Plane.
5.  **Presentation**: Control Plane wraps response -> IDE renders Markdown.

## Diagram

```mermaid
graph TD
    User[User] -->|Interacts| IDE[Presentation Plane (VS Code)]
    IDE <-->|JSON/HTTP| Control[Control Plane (Runtime)]
    
    subgraph Backend [Agent Runtime]
        Control <-->|Orchestrates| Agent1[Cognition Plane (Agent A)]
        Control <-->|Orchestrates| Agent2[Cognition Plane (Agent B)]
    end
    
    Agent1 <-->|Queries| Knowledge[Knowledge Plane (CPG + RAG)]
    Agent2 <-->|Queries| Knowledge
```
