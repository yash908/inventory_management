"""
CRUD operations — all database queries are centralized here.
Business logic for inventory deduction is enforced at this layer.
"""
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from . import models, schemas


# =============================================================================
# Products
# =============================================================================

def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.sku == sku.upper()).first()


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
    return db.query(models.Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    if get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"SKU '{product.sku}' already exists.")
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.flush()
    log_activity(db, "Product Created", f"Product '{db_product.name}' (SKU: {db_product.sku}) created with stock {db_product.quantity} and price ₹{db_product.price}.")
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> models.Product:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    update_data = product_update.model_dump(exclude_unset=True)

    # Check SKU uniqueness if updating
    if "sku" in update_data:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing and existing.id != product_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"SKU '{update_data['sku']}' already exists.")

    for key, value in update_data.items():
        setattr(db_product, key, value)

    log_activity(db, "Product Updated", f"Product '{db_product.name}' (SKU: {db_product.sku}) was updated. Price: ₹{db_product.price}, Stock: {db_product.quantity}.")
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> models.Product:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    log_activity(db, "Product Deleted", f"Product '{db_product.name}' (SKU: {db_product.sku}) was deleted.")
    db.delete(db_product)
    db.commit()
    return db_product


# =============================================================================
# Customers
# =============================================================================

def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email.lower()).first()


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Customer]:
    return db.query(models.Customer).offset(skip).limit(limit).all()


def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    if get_customer_by_email(db, customer.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{customer.email}' already registered.")
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.flush()
    log_activity(db, "Customer Created", f"Customer '{db_customer.full_name}' ({db_customer.email}) added.")
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int) -> models.Customer:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    log_activity(db, "Customer Deleted", f"Customer '{db_customer.full_name}' ({db_customer.email}) was deleted.")
    db.delete(db_customer)
    db.commit()
    return db_customer


# =============================================================================
# Orders
# =============================================================================

def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )


def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_order(db: Session, order: schemas.OrderCreate) -> models.Order:
    # Validate customer exists
    customer = get_customer(db, order.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    total_amount = Decimal("0.00")
    db_items: List[models.OrderItem] = []

    # Validate all products and inventory before making any changes
    for item in order.items:
        product = get_product(db, item.product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product ID {item.product_id} not found.")
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}."
            )

    # All checks passed — now create order and deduct inventory atomically
    db_order = models.Order(
        customer_id=order.customer_id,
        status="pending",
        total_amount=Decimal("0.00"),
    )
    db.add(db_order)
    db.flush()  # Get the order ID before committing

    for item in order.items:
        product = get_product(db, item.product_id)
        unit_price = Decimal(str(product.price))
        subtotal = unit_price * item.quantity
        total_amount += subtotal

        # Deduct inventory
        product.quantity -= item.quantity

        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=unit_price,
        )
        db.add(db_item)

    db_order.total_amount = total_amount
    log_activity(db, "Order Placed", f"Order #{db_order.id} placed for customer '{customer.full_name}' totaling ₹{total_amount:.2f}.")
    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int) -> models.Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    # Restore stock levels
    for item in db_order.items:
        product = get_product(db, item.product_id)
        if product:
            product.quantity += item.quantity
    log_activity(db, "Order Cancelled", f"Order #{db_order.id} was cancelled/deleted and stock was restored.")
    db.delete(db_order)
    db.commit()
    return db_order


# =============================================================================
# Dashboard
# =============================================================================

def get_dashboard_stats(db: Session, low_stock_threshold: int = 10) -> schemas.DashboardStats:
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock = db.query(models.Product).filter(models.Product.quantity <= low_stock_threshold).all()
    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock,
    )


# =============================================================================
# Audit Logs
# =============================================================================

def log_activity(db: Session, action: str, details: str):
    try:
        db_log = models.AuditLog(action=action, details=details)
        db.add(db_log)
        db.flush()
    except Exception as e:
        print(f"Failed to write audit log: {e}")


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()

