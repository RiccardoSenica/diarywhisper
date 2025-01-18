from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import re

class CommandRequest(BaseModel):
    message: str
    
class Settings(BaseSettings):
    API_KEY: str = "default-key"

    class Config:
        env_file = ".env"

settings = Settings()
app = FastAPI(title="WalletWhisper")
api_key_header = APIKeyHeader(name="X-API-Key")

def parse_command(message: str):
    """
    Parse commands like:
    - "add 25 groceries"    -> Add expense of 25 for groceries
    - "spent 25 groceries"  -> Same as add
    - "balance"            -> Get current balance
    - "last"              -> Get last transactions
    """
    message = message.lower().strip()
    
    # Add/spent command
    expense_match = re.match(r'^(add|spent)\s+(\d+\.?\d*)\s+(.+)$', message)
    if expense_match:
        _, amount, category = expense_match.groups()
        return {
            "command": "add_expense",
            "amount": float(amount),
            "category": category.strip()
        }
    
    # Balance command
    if message == "balance":
        return {"command": "get_balance"}
    
    # Last transactions command
    if message == "last":
        return {"command": "get_last_transactions"}
        
    raise HTTPException(status_code=400, detail="Invalid command format")

@app.post("/api/command")
async def process_command(
    command: CommandRequest,
    api_key: str = Depends(verify_api_key)
):
    try:
        parsed = parse_command(command.message)
        
        if parsed["command"] == "add_expense":
            return {
                "status": "success",
                "message": f"Added expense: {parsed['amount']} for {parsed['category']}"
            }
            
        elif parsed["command"] == "get_balance":
            return {
                "status": "success",
                "message": "Your current balance is X"  # Implement actual balance
            }
            
        elif parsed["command"] == "get_last_transactions":
            return {
                "status": "success",
                "message": "Here are your last transactions"  # Implement actual list
            }
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}