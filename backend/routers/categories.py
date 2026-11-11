# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.database import get_db
# from app import crud, schema
# from app.auth import get_current_user

# router = APIRouter(prefix="/categories", tags=["Categories"])

# @router.post("/", response_model=schema.CategoryResponse)
# def create_category(
#     category: schema.CategoryCreate,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user)
# ):
#     return crud.create_category(
#         db,
#         category,
#         current_user
#     )

# @router.get("/", response_model=list[schema.CategoryResponse])
# def get_categories(
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user)
# ):
#     return crud.get_categories(
#         db,
#         current_user
#     )

# @router.delete("/{category_id}")
# def delete_category(
#     category: str,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user)
# ):
#     return crud.delete_category(
#         db,
#         category,
#         current_user
#     )