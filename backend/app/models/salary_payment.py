from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SalaryPayment(Base):
    __tablename__ = "salary_payments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    worker_id: Mapped[int] = mapped_column(
        ForeignKey(
            "workers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    payment_month: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
    )

    payment_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Cash",
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    worker: Mapped["Worker"] = relationship(
        "Worker",
        back_populates="salary_payments",
    )