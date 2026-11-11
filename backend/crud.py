from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend import models, schema, auth
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from backend.auth import get_current_user

# def create_category(
#     db: Session,
#     category: schema.CategoryCreate,
#     current_user : models.User
# ):
#     db_category = models.Category(
#         name=category.name,
#         owner_id=current_user.id
#     )
#     db.add(db_category)
#     db.commit()
#     db.refresh(db_category)
#     return db_category

# def get_categories(
#     db: Session,
#     current_user : models.User
# ):
#     return (
#         db.query(models.Category)
#         .filter(
#             models.Category.owner_id == current_user.id
#         )
#         .all()
#     )

# def delete_category(
#     db: Session,
#     category: str,
#     current_user : models.User
# ):
#     category = (
#         db.query(models.Category)
#         .filter(
#             models.Category == category,
#             models.Category.owner_id == current_user.id
#         )
#         .first()
#     )
#     if category is None:
#         return None
#     db.delete(category)
#     db.commit()
#     return category

def create_expense(
    db: Session,
    expense: schema.ExpenseCreate,
    current_user : models.User
):

    # category = (
    #     db.query(models.Category)
    #     .filter(
    #         models.Category == expense.category,
    #         models.Category.owner_id == current_user.id
    #     )
    #     .first()
    # )
    # if category is None:
    #     raise HTTPException(
    #         status_code=404,
    #         detail="Category not found"
    #     )
    db_expense = models.Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        owner_id=current_user.id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_expenses(
    db : Session,
    current_user : models.User
):
    return db.query(models.Expense).filter(models.Expense.owner_id==current_user.id).order_by(models.Expense.created_at.desc()).all()

def get_expense(
    db : Session,
    expense_id : int,
    current_user : models.User
):
    expense = (
        db.query(models.Expense)
        .filter(
            models.Expense.id == expense_id,
            models.Expense.owner_id == current_user.id
        )
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

def filter_expense(
    db : Session,
    min_amount: float,
    current_user : models.User
):
    return (
        db.query(models.Expense)
        .filter(models.Expense.amount>=min_amount, models.Expense.owner_id == current_user.id)
        .all()
    )

def get_expenses_by_date(
    db: Session,
    user_id: int,
    start_date,
    end_date
):
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(
    end_date + timedelta(days=1),
    datetime.min.time()
)
    return (
        db.query(models.Expense)
        .filter(
            models.Expense.owner_id == user_id,
            models.Expense.created_at >= start_datetime,
            models.Expense.created_at < end_datetime
        )
        .all()
    )

def update_expense(
    db : Session,
    expense_id : int,
    updated_expense : schema.ExpenseUpdate,
    current_user : models.User
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id==expense_id, models.Expense.owner_id == current_user.id)
        .first()
    )
    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )
    expense.title = updated_expense.title
    expense.amount = updated_expense.amount
    expense.category = updated_expense.category
    db.commit()
    db.refresh(expense)
    return expense

def delete_expense(
    db : Session,
    expense_id : int,
    current_user : models.User
):
    expense = (
        db.query(models.Expense).
        filter(models.Expense.id==expense_id, models.Expense.owner_id == current_user.id).first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return None

def create_user(db: Session, user: schema.UserCreate):
    from sqlalchemy.exc import IntegrityError
    hashed = auth.hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed
    )
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = (
        db.query(models.User)
        .filter(models.User.username == username)
        .first()
    )
    if user is None:
        return None
    if not auth.verify_password(password, user.hashed_password):
        return None
    return user

def get_total_spending(
    db: Session,
    user_id: int
):
    return (
        db.query(
            func.sum(models.Expense.amount)
        )
        .filter(
            models.Expense.owner_id == user_id
        )
        .scalar()
    )