from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

class CategoryResponse(BaseModel):
    id: int
    name: str
    model_config = {
        "from_attributes": True
    }

class BudgetSet(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    amount: Decimal = Field(gt=0)

class BudgetResponse(BaseModel):
    id: int
    category: Optional[str]
    amount: Decimal
    model_config = {
        "from_attributes": True
    }

class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)

class ExpenseUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)

class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: Decimal
    category: str
    created_at: datetime
    model_config = {
        "from_attributes": True
    }

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    model_config = {
        "from_attributes": True
    }

class LoginRequest(BaseModel):
    username: str
    password: str