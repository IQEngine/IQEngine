import database.database
from database.models import Processor
from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection

router = APIRouter()


@router.post("/api/processors", status_code=201, response_model=Processor)
def create_processor(
    processor: Processor,
    processors: Collection[Processor] = Depends(
        database.database.processors_collection
    ),
):
    """
    Create a new processor. The processor will be henceforth identified by name which
    must be unique or this function will return a 400.
    """
    if processors.find_one({"name": processor.name}):
        raise HTTPException(status_code=409, detail="Processor Already Exists")

    processors.insert_one(processor.dict(by_alias=True, exclude_unset=True))
    return processor


@router.get("/api/processors", response_model=list[Processor])
def get_processors(
    processors: Collection[Processor] = Depends(
        database.database.processors_collection
    ),
):
    """
    Get a list of all processors.
    """
    return list(processors.find({}))


@router.get("/api/processors/{processor_name}", response_model=Processor)
def get_processor(
    processor_name: str,
    processors: Collection[Processor] = Depends(
        database.database.processors_collection
    ),
):
    """
    Get a processor by name.
    """
    processor = processors.find_one({"name": processor_name})
    if processor is None:
        raise HTTPException(status_code=404, detail="Processor Not Found")
    return processor


@router.put("/api/processors/{processor_name}", response_model=Processor)
def update_processor(
    processor_name: str,
    processor: Processor,
    processors: Collection[Processor] = Depends(
        database.database.processors_collection
    ),
):
    """
    Update a processor by name.
    """
    processor = processors.find_one_and_update(
        {"name": processor_name},
        {"$set": processor.dict(by_alias=True, exclude_unset=True)},
        return_document=True,
    )
    if processor is None:
        raise HTTPException(status_code=404, detail="Processor Not Found")
    return processor


@router.delete("/api/processors/{processor_name}")
def delete_processor(
    processor_name: str,
    processors: Collection[Processor] = Depends(
        database.database.processors_collection
    ),
):
    """
    Delete a processor by name.
    """
    processor = processors.find_one_and_delete({"name": processor_name}, {"_id": 0})
    if processor is None:
        raise HTTPException(status_code=404, detail="Processor Not Found")
    return processor
