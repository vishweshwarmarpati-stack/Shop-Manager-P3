from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.shop import Shop
from app.models.user import User
from app.routes.auth import get_current_user, require_admin
from app.schemas.worker import (
    WorkerCreate,
    WorkerResponse,
    WorkerUpdate,
)


router = APIRouter(
    prefix="/workers",
    tags=["Workers"],
)


def worker_to_response(
    worker: Worker,
) -> WorkerResponse:
    return WorkerResponse(
        id=worker.id,
        name=worker.name,
        shop_id=worker.shop_id,
        shop_name=worker.shop.name,
        salary=worker.salary,
        salary_paid=worker.salary_paid,
    )


def ensure_worker_access(
    worker: Worker,
    current_user: User,
):
    # ADMIN can access workers from every shop.
    if current_user.role == "ADMIN":
        return

    # CASHIER can only access workers
    # belonging to their assigned shop.
    if current_user.shop_id != worker.shop_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this worker.",
        )


@router.get(
    "",
    response_model=list[WorkerResponse],
)
def get_workers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Worker)

    # ADMIN sees all workers.
    if current_user.role == "ADMIN":
        workers = (
            query
            .order_by(Worker.id)
            .all()
        )

    # CASHIER sees only workers
    # from their assigned shop.
    else:
        workers = (
            query
            .filter(
                Worker.shop_id == current_user.shop_id
            )
            .order_by(Worker.id)
            .all()
        )

    return [
        worker_to_response(worker)
        for worker in workers
    ]


@router.get(
    "/{worker_id}",
    response_model=WorkerResponse,
)
def get_worker(
    worker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    worker = (
        db.query(Worker)
        .filter(
            Worker.id == worker_id
        )
        .first()
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found.",
        )

    ensure_worker_access(
        worker,
        current_user,
    )

    return worker_to_response(worker)


@router.post(
    "",
    response_model=WorkerResponse,
    status_code=201,
)
def create_worker(
    worker_data: WorkerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # CASHIER can only create workers
    # for their own shop.
    if (
        current_user.role != "ADMIN"
        and worker_data.shop_id != current_user.shop_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create workers for your assigned shop.",
        )

    shop = db.get(
        Shop,
        worker_data.shop_id,
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found.",
        )

    new_worker = Worker(
        name=worker_data.name,
        shop_id=worker_data.shop_id,
        salary=worker_data.salary,
        salary_paid=worker_data.salary_paid,
    )

    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)

    return worker_to_response(new_worker)


@router.put(
    "/{worker_id}",
    response_model=WorkerResponse,
)
def update_worker(
    worker_id: int,
    worker_data: WorkerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    worker = (
        db.query(Worker)
        .filter(
            Worker.id == worker_id
        )
        .first()
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found.",
        )

    ensure_worker_access(
        worker,
        current_user,
    )

    update_data = worker_data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )

    if "shop_id" in update_data:
        new_shop_id = update_data["shop_id"]

        shop = db.get(
            Shop,
            new_shop_id,
        )

        if shop is None:
            raise HTTPException(
                status_code=404,
                detail="Shop not found.",
            )

        # CASHIER cannot move a worker
        # to another shop.
        if (
            current_user.role != "ADMIN"
            and new_shop_id != current_user.shop_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot move a worker to another shop.",
            )

    for key, value in update_data.items():
        setattr(
            worker,
            key,
            value,
        )

    db.commit()
    db.refresh(worker)

    return worker_to_response(worker)


@router.delete(
    "/{worker_id}",
)
def delete_worker(
    worker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    worker = (
        db.query(Worker)
        .filter(
            Worker.id == worker_id
        )
        .first()
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found.",
        )

    ensure_worker_access(
        worker,
        current_user,
    )

    db.delete(worker)
    db.commit()

    return {
        "message": "Worker deleted successfully.",
        "worker_id": worker_id,
    }