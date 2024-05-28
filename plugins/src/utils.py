import re


def sanitize(job_id):
    return re.sub(r"[^\w-]+", "", job_id)
