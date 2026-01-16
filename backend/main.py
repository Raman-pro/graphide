"""
GraphIDE Agent Runtime - Stage 1 Stub

This is a minimal FastAPI backend that:
- Receives requests from the IDE
- Logs them for debugging
- Returns a dummy response

NO AGENT LOGIC IS IMPLEMENTED HERE.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
import requests
import json
import os
import sys
import uuid
from typing import List, Dict, Optional


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GraphIDE Agent Runtime",
    description="Stage 1: IPC Stub - No agents implemented",
    version="0.1.0"
)

# Allow CORS for localhost (IDE will call from Electron)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models (following Stage 0 IPC schemas)
# ============================================================================

class CodeRange(BaseModel):
    startLine: int
    endLine: int
    startColumn: Optional[int] = None
    endColumn: Optional[int] = None


class AgentRequest(BaseModel):
    """Request from IDE to Agent Runtime (Stage 0 schema)"""
    intent: str
    filePath: str
    language: str
    codeRange: Optional[CodeRange] = None
    userQuery: Optional[str] = None


class AgentOutput(BaseModel):
    agentName: str
    markdownOutput: str
    metadata: Optional[dict] = None


class AgentResponse(BaseModel):
    """Response from Agent Runtime to IDE (Stage 0 schema)"""
    status: str  # "success", "error", "processing"
    agentOutputs: Optional[List[AgentOutput]] = None
    patchProposals: Optional[List[dict]] = None
    validationStatus: Optional[dict] = None

class ContextField:
    def __init__(self, key: str, value: str):
        self.key = key
        self.value = value

class SessionData:
    def __init__(self, id: str, context_metadata: List[ContextField]):
        self.id = id
        self.context_metadata = context_metadata

class CreateSessionResponse:
    def __init__(self, data: SessionData):
        self.data = data

class MediaUploadResponse:
    def __init__(self, data: Dict):
        self.data = data
# ============================================================================
# Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "stage": 1, "message": "GraphIDE Agent Runtime is running"}



@app.post("/agent/request", response_model=AgentResponse)
async def handle_agent_request(request: AgentRequest):
    """
    Handle incoming request from IDE.
    
    Stage 1: Just log and return a stub response.
    NO AGENT LOGIC IS IMPLEMENTED.
    """
    # Log the incoming request
    logger.info("=" * 60)
    logger.info("INCOMING REQUEST FROM IDE")
    logger.info(f"  Intent: {request.intent}")
    logger.info(f"  File: {request.filePath}")
    logger.info(f"  Language: {request.language}")
    if request.codeRange:
        logger.info(f"  Range: L{request.codeRange.startLine}-L{request.codeRange.endLine}")
    if request.userQuery:
        logger.info(f"  Query: {request.userQuery}")
    logger.info("=" * 60)

    # Return stub response
    payload={
"query": f"You are the Senior Security Orchestrator. Your goal is to manage a vulnerability analysis pipeline.undefined1. Receive code snippets from the user.\n2. Identify the language (C/C++). of code:{request.userQuery}",
"endpointId": "predefined-openai-gpt4o",
"responseMode": "sync",
"reasoningMode": "low",
"agentIds": [],
"onlyFulfillment": "false",
"modelConfigs": {
"fulfillmentPrompt": "string",
"stopSequences": [],
"temperature": 0.7,
"topP": 1,
"presencePenalty": 0,
"frequencyPenalty": 0
}
}

    resp=requests.post("https://api.on-demand.io/chat/v1/sessions/6969c536539e622c16edbea4/query",headers={
        "apikey":"rovg7LltIcxMXXk1AUKSaVEDxpgF77Tl",
    },json=payload)
    
    content=resp.json()
    
    print(content)
    
    return AgentResponse(
        status="success",
        agentOutputs=[
            AgentOutput(
                agentName="stub",
                markdownOutput=f"{content["data"]["answer"]}",
                metadata={"stage": 1, "stub": True}
            )
        ],
        patchProposals=[],
        validationStatus={"passed": True, "errors": []}
    )



# ============================================================================
# Entry point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
