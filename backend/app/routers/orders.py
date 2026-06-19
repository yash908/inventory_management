from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order. Business logic enforced:
    - Customer must exist.
    - All products must exist and have sufficient stock.
    - Inventory is automatically deducted.
    - Total amount is calculated automatically.
    """
    return crud.create_order(db=db, order=order)


@router.get("/", response_model=List[schemas.OrderResponse])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve a paginated list of all orders."""
    return crud.get_orders(db, skip=skip, limit=limit)


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific order with its full item details."""
    db_order = crud.get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return db_order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel/delete an order by ID."""
    crud.delete_order(db=db, order_id=order_id)
