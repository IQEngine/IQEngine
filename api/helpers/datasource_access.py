from fastapi import Depends
from helpers.authorization import get_current_user
from database.database import db


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
    roles = user.get("roles", [])
    if isinstance(roles, str):
        roles = [roles]
    roles.append(user.get("preferred_username"))

    data_source = await db().datasources.find_one(
        {"account": account, "container": container}
    )

    if data_source:
        if hasattr(data_source, 'public') and data_source.public:
            return "public"
        if hasattr(data_source, 'readers') and any(role in data_source.readers for role in roles):
            return "reader"
        if hasattr(data_source, 'owners') and any(role in data_source.owners for role in roles):
            return "owner"
    return None
