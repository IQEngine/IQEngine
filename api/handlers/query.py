from typing import Dict, Any
from fastapi import Body
from pydantic import BaseModel

class QueryCondition(BaseModel):
    query: Dict[str, Any]