from fastapi import Depends
from helpers.authorization import get_current_user
from app.database import db


async def check_access(account: str, container: str, user=Depends(get_current_user)) -> str | None:
    """
    Access check for a datasource by account and container using roles from a JWT claim.

    Parameters
    ----------
    account : str
        The account name.
    container : str
        The container name.
    roles : List[str]
        The roles from the JWT claim.

    Returns
    -------
    "public", "reader", "owner", or None
    """
    groups = user.get("groups", [])
    if isinstance(groups, str):
        groups = [groups]
    groups.append(user.get("preferred_username"))

    data_source = await db().datasources.find_one(
        {"account": account, "container": container}
    )

    if data_source:
        if 'owners' in data_source and any(group in data_source['owners'] for group in groups):
            return "owner"
        if 'readers' in data_source and any(group in data_source['readers'] for group in groups):
            return "reader"
        if 'public' in data_source and data_source['public']:
            return "public"
    return None
