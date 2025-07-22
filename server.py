from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
    RedirectResponse,
    Response,
    FileResponse,
)
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai.types import GenerateContentConfig, AutomaticFunctionCallingConfig
import os
from dotenv import load_dotenv
import httpx
import aiohttp
from fastapi.concurrency import run_in_threadpool
from typing import Dict, Optional
from dotenv import load_dotenv
import subprocess

app = FastAPI()
from fastapi.staticfiles import StaticFiles
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession
import base64
import asyncio
import json
from google.genai import types
from tools import tools
import contextlib
import signal


# Ensure clean shutdown on SIGTERM/SIGINT
def handle_exit(signum, frame):
    print(f"Received signal {signum}, shutting down...")
    import sys

    sys.exit(0)


signal.signal(signal.SIGTERM, handle_exit)
signal.signal(signal.SIGINT, handle_exit)

app.mount(
    "/assets", StaticFiles(directory="jira-chat-automator/dist/assets"), name="assets"
)


async def calculate_token_usage(response, model_name):
    total_token_usage = {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "thinking_tokens": 0,
    }
    input_tokens = (
        response.usage_metadata.prompt_token_count
        if response.usage_metadata.prompt_token_count
        else 0
    )
    output_tokens = (
        response.usage_metadata.candidates_token_count
        if response.usage_metadata.candidates_token_count
        else 0
    )
    thinking_tokens = (
        response.usage_metadata.thoughts_token_count
        if response.usage_metadata.thoughts_token_count
        else 0
    )
    total_tokens = (
        response.usage_metadata.total_token_count
        if response.usage_metadata.total_token_count
        else 0
    )

    total_token_usage["input_tokens"] += input_tokens
    total_token_usage["output_tokens"] += output_tokens
    total_token_usage["total_tokens"] += total_tokens
    if thinking_tokens:
        total_token_usage["thinking_tokens"] += thinking_tokens
    input_cost = (total_token_usage["input_tokens"] / 1_000_000) * MODEL_CONFIG[
        f"{model_name}"
    ]["input_price_per_million"]
    output_cost = (
        (total_token_usage["output_tokens"] + total_token_usage["thinking_tokens"])
        / 1_000_000
    ) * MODEL_CONFIG[f"{model_name}"]["output_price_per_million"]
    total_cost = round(input_cost + output_cost, 4)

    return total_cost, total_token_usage


# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://command-dept-draft-newspapers.trycloudflare.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper function to safely close aiohttp sessions
@contextlib.asynccontextmanager
async def get_aiohttp_client():
    session = aiohttp.ClientSession()
    try:
        yield session
    finally:
        await session.close()


load_dotenv()
client = genai.Client(
    api_key=os.environ.get("GOOGLE_API_KEY"),
)

# Model pricing configuration
MODEL_CONFIG = {
    "gemini-2.5-flash": {
        "name": "gemini-2.5-flash",  # Or whichever model you are using
        "input_price_per_million": 0.3,
        "output_price_per_million": 2.5,
    },
    "gemini-2.0-flash": {
        "name": "gemini-2.0-flash",  # Or whichever model you are using
        "input_price_per_million": 0.1,
        "output_price_per_million": 0.4,
    },
    "gemini-2.0-flash-lite": {
        "name": "gemini-2.0-flash-lite",  # Or whichever model you are using
        "input_price_per_million": 0.075,
        "output_price_per_million": 0.3,
    },
    "gemma-3n-e4b-it": {
        "name": "gemma-3n-e4b-it",
        "input_price_per_million": 0,
        "output_price_per_million": 0,
    },
}

JIRA_CLIENT_ID = os.getenv("JIRA_CLIENT_ID")
JIRA_CLIENT_SECRET = os.getenv("JIRA_CLIENT_SECRET")
CALLBACK_URL = os.getenv("CALLBACK_URL")

# In-memory user store (replace with DB in production)
users: Dict[str, dict] = {}

# Store chat sessions per client
client_chats: Dict[str, any] = {}


# Serve index.html at root
@app.get("/")
def serve_react_index():
    return FileResponse("jira-chat-automator/dist/index.html")


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    access_token = websocket.cookies.get("access_token")
    cloud_id = websocket.cookies.get("cloud_id")
    if not access_token or not cloud_id:
        await websocket.send_text("ERROR: Missing access token or cloud id.")
        await websocket.send_text("__END_STREAM__")
        await websocket.close()
        return
    # Connect to MCP server
    async with streamablehttp_client(
        "http://localhost:9096/mcp",
        headers={
            "Authorization": f"Bearer {access_token}",
            "X-Atlassian-Cloud-Id": cloud_id,
        },
    ) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            history = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(
                            text="You are a helpful Jira assistant. Respond with reasoning and context when possible."
                        )
                    ],
                )
            ]
            while True:
                try:
                    data = await websocket.receive_text()
                    history.append(
                        types.Content(
                            role="user", parts=[types.Part.from_text(text=data)]
                        )
                    )
                    # Streaming Gemini response
                    streamed_text = ""
                    try:
                        costing = 0
                        token_usage = {
                            "input_tokens": 0,
                            "output_tokens": 0,
                            "thinking_tokens": 0,
                        }
                        async for (
                            chunk
                        ) in await client.aio.models.generate_content_stream(
                            model="gemini-2.0-flash",
                            contents=history,
                            config=types.GenerateContentConfig(
                                system_instruction=(
                                    "You are a helpful Jira assistant. Only answer questions related to Jira. "
                                    "Do not answer anything except Jira-related queries. "
                                    "Never ask the user for their identifier (email, username, key, or account ID); you already have all required context. "
                                    "For any Jira action, use the provided tools and follow the tool descriptions and JQL examples. "
                                    "Use JQL only when the tool description or parameters require a JQL query; do not use JQL for other tools. "
                                    "Always return your response in beautiful markdown format, with tables and lists where appropriate, and make the output easy to read in a chat application."
                                ),
                                tools=tools,
                                response_mime_type="text/plain",
                            ),
                        ):
                            try:
                                # Calculate token usage for each chunk
                                print(chunk.text)
                                cost, token_usage_ = await calculate_token_usage(
                                    chunk, "gemini-2.0-flash"
                                )
                                costing += cost
                                token_usage["input_tokens"] += token_usage_[
                                    "input_tokens"
                                ]
                                token_usage["output_tokens"] += token_usage_[
                                    "output_tokens"
                                ]
                                token_usage["thinking_tokens"] += token_usage_[
                                    "thinking_tokens"
                                ]

                                if chunk.function_calls:
                                    function_call = chunk.function_calls[0]
                                    # Send tool call notification
                                    await websocket.send_text("__TOOL_CALL_START__")
                                    await websocket.send_text(
                                        json.dumps(
                                            {
                                                "tool": function_call.name,
                                                "args": function_call.args,
                                            }
                                        )
                                    )
                                    result = await session.call_tool(
                                        function_call.name, function_call.args
                                    )
                                    print(result)
                                    # Send tool call end notification
                                    await websocket.send_text("__TOOL_CALL_END__")
                                    try:
                                        result_content = result.content[0].text
                                        # Ask Gemini to format the tool result in markdown, and stream the markdown response
                                        format_prompt = types.Content(
                                            role="user",
                                            parts=[
                                                types.Part.from_text(
                                                    text=f"Format this result for display to the user in markdown: {result_content}. and format the markdown in a format so it's easily readable in a chat application. and just return the result not any extra content"
                                                )
                                            ],
                                        )
                                        async for (
                                            func_chunk
                                        ) in await client.aio.models.generate_content_stream(
                                            model="gemini-2.0-flash-lite",
                                            contents=format_prompt,
                                            config=types.GenerateContentConfig(
                                                response_mime_type="text/plain",
                                            ),
                                        ):
                                            try:
                                                # Calculate token usage for formatting chunks
                                                format_cost, format_token_usage = (
                                                    await calculate_token_usage(
                                                        func_chunk,
                                                        "gemini-2.0-flash-lite",
                                                    )
                                                )
                                                costing += format_cost
                                                token_usage[
                                                    "input_tokens"
                                                ] += format_token_usage["input_tokens"]
                                                token_usage[
                                                    "output_tokens"
                                                ] += format_token_usage["output_tokens"]
                                                token_usage[
                                                    "thinking_tokens"
                                                ] += format_token_usage[
                                                    "thinking_tokens"
                                                ]

                                                if (
                                                    hasattr(func_chunk, "text")
                                                    and func_chunk.text
                                                ):
                                                    chunk_text = func_chunk.text
                                                    chunk_text = chunk_text.replace(
                                                        "```markdown", ""
                                                    ).replace("```", "")
                                                    streamed_text += chunk_text
                                                    await websocket.send_text(
                                                        chunk_text
                                                    )
                                            except Exception as chunk_err:
                                                print(
                                                    f"Chunk streaming error: {chunk_err}, raw chunk: {func_chunk}"
                                                )
                                                continue

                                    except (AttributeError, IndexError) as e:
                                        # Handle case when result structure is unexpected
                                        result_content = str(result)
                                else:
                                    if hasattr(chunk, "text") and chunk.text:
                                        streamed_text += chunk.text
                                        await websocket.send_text(chunk.text)
                            except json.JSONDecodeError as json_err:
                                pass
                            except Exception as chunk_err:
                                print(f"Chunk processing error: {chunk_err}")
                                continue  # Skip problematic chunks and continue processing
                    except json.JSONDecodeError as json_err:
                        pass
                    except Exception as e:
                        print(type(e))
                        print(f"Streaming error: {e}")
                        await websocket.send_text(f"ERROR: Streaming error: {str(e)}")
                    except json.JSONDecodeError as json_err:
                        pass
                    finally:
                        # Send token usage information before ending stream
                        token_info = {
                            "token_usage": token_usage,
                            "cost": round(costing, 4),
                        }
                        await websocket.send_text("__TOKEN_USAGE__")
                        await websocket.send_text(json.dumps(token_info))
                        await websocket.send_text("__END_STREAM__")

                    # Add the model's streamed response to history if it's not empty
                    if streamed_text:
                        history.append(
                            types.Content(
                                role="model",
                                parts=[types.Part.from_text(text=streamed_text)],
                            )
                        )
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    print(f"Message handling error: {str(e)}")
                    await websocket.send_text(
                        f"ERROR: Message handling error: {str(e)}"
                    )
                    await websocket.send_text("__END_STREAM__")


@app.get("/auth/callback")
async def jira_auth_callback(
    code: str = None, state: str = None, request: Request = None
):
    if code and state:
        token_url = "https://auth.atlassian.com/oauth/token"
        payload = {
            "grant_type": "authorization_code",
            "client_id": JIRA_CLIENT_ID,
            "client_secret": JIRA_CLIENT_SECRET,
            "code": code,
            "redirect_uri": CALLBACK_URL,
        }
        headers = {"Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, json=payload, headers=headers)
                token_data = response.json()
            access_token = token_data.get("access_token")
            if access_token:
                cloud_url = "https://api.atlassian.com/oauth/token/accessible-resources"
                cloud_id = ""
                try:
                    async with httpx.AsyncClient() as client:
                        cloud_response = await client.get(
                            cloud_url,
                            headers={"Authorization": f"Bearer {access_token}"},
                        )
                        cloud_data = cloud_response.json()
                        print(cloud_data)
                        cloud_id = (
                            cloud_data[0]["id"]
                            if cloud_data
                            and isinstance(cloud_data, list)
                            and "id" in cloud_data[0]
                            else ""
                        )
                except Exception as e:
                    print(f"Error getting cloud resources: {e}")

                # Fetch Jira user info and store in users dict
                user_info = None
                if access_token and cloud_id:
                    try:
                        async with httpx.AsyncClient() as client:
                            user_resp = await client.get(
                                f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself",
                                headers={
                                    "Authorization": f"Bearer {access_token}",
                                    "Accept": "application/json",
                                },
                                timeout=10,
                            )
                            if user_resp.status_code == 200:
                                user_info = user_resp.json()
                                account_id = user_info.get("accountId")
                                if account_id:
                                    users[account_id] = user_info
                    except Exception as e:
                        print(f"Failed to fetch/store user info: {e}")

                # Redirect to frontend with access_token and cloud_id in query params
                redirect_url = f"https://jira-automation.mnv-dev.site?access_token={access_token}&cloud_id={cloud_id}"
                return RedirectResponse(url=redirect_url, status_code=302)
            else:
                return JSONResponse(
                    {
                        "error": "No access token in response.",
                        "token_response": token_data,
                    },
                    status_code=400,
                )
        except Exception as e:
            print(f"Auth callback error: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)
    return JSONResponse(
        {"error": "Missing code or state in callback."}, status_code=400
    )


@app.post("/logout")
def logout_endpoint():
    response = Response(content="Logged out", status_code=200)
    # Clear cookies by setting them with max-age=0 and matching domain/path/flags
    response.set_cookie(
        key="access_token",
        value="",
        max_age=0,
        expires=0,
        path="/",
        domain=".mnv-dev.site",
        secure=True,
        httponly=True,
        samesite="none",
    )
    response.set_cookie(
        key="cloud_id",
        value="",
        max_age=0,
        expires=0,
        path="/",
        domain=".mnv-dev.site",
        secure=True,
        httponly=True,
        samesite="none",
    )
    return response


# Register shutdown event to close any resources
@app.on_event("shutdown")
async def app_shutdown():
    # Close any lingering aiohttp resources
    print("Shutting down application, cleaning up resources...")

    # Force close any remaining client sessions
    for task in asyncio.all_tasks():
        if not task.done() and not task.cancelled() and "client_session" in str(task):
            task.cancel()

    # Give tasks a moment to clean up
    await asyncio.sleep(1)


async def execute_with_retry(func, *args, max_retries=2, **kwargs):
    """Execute a function with retry logic."""
    retries = 0
    last_exception = None

    while retries <= max_retries:
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            retries += 1
            print(f"Retry {retries}/{max_retries} after error: {str(e)}")
            await asyncio.sleep(1)  # Wait a second before retrying

    # If we get here, all retries failed
    raise last_exception


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=10000, reload=True)
