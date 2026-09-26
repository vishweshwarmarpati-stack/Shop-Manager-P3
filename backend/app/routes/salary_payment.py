from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.salary_payment import SalaryPayment
from app.models.user import User
from app.models.worker import Worker
from app.routes.auth import require_admin
from app.schemas.salary_payment import (
    SalaryPaymentCreate,
    SalaryPaymentResponse,
)


router = APIRouter(
    prefix="/salary-payments",
    tags=["Salary Payments"],
)


def payment_to_response(
    payment: SalaryPayment,
) -> SalaryPaymentResponse:
    return SalaryPaymentResponse(
        id=payment.id,
        worker_id=payment.worker_id,
        worker_name=payment.worker.name,
        amount=payment.amount,
        payment_month=payment.payment_month,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        notes=payment.notes,
    )


@router.get(
    "",
    response_model=list[SalaryPaymentResponse],
)
def get_salary_payments(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(SalaryPayment)
        .order_by(
            SalaryPayment.payment_date.desc()
        )
        .all()
    )

    return [
        payment_to_response(payment)
        for payment in payments
    ]


@router.get(
    "/worker/{worker_id}",
    response_model=list[SalaryPaymentResponse],
)
def get_worker_salary_payments(
    worker_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    worker = db.get(
        Worker,
        worker_id,
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found.",
        )

    payments = (
        db.query(SalaryPayment)
        .filter(
            SalaryPayment.worker_id
            == worker_id
        )
        .order_by(
            SalaryPayment.payment_date.desc()
        )
        .all()
    )

    return [
        payment_to_response(payment)
        for payment in payments
    ]


@router.post(
    "",
    response_model=SalaryPaymentResponse,
    status_code=201,
)
def create_salary_payment(
    payment_data: SalaryPaymentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    worker = db.get(
        Worker,
        payment_data.worker_id,
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found.",
        )

    payment = SalaryPayment(
        worker_id=payment_data.worker_id,
        amount=payment_data.amount,
        payment_month=payment_data.payment_month,
        payment_method=payment_data.payment_method,
        notes=payment_data.notes,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment_to_response(payment)


@router.delete(
    "/{payment_id}",
)
def delete_salary_payment(
    payment_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    payment = db.get(
        SalaryPayment,
        payment_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Salary payment not found.",
        )

    db.delete(payment)
    db.commit()

    return {
        "message": "Salary payment deleted successfully.",
        "payment_id": payment_id,
    }