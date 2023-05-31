from fastapi import APIRouter

router = APIRouter()


@router.get("/api/status")
def get_status():
    return "OK"
