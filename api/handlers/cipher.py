import os
from cryptography.fernet import Fernet
from pydantic import SecretStr


def get_key():
    key = os.getenv("DB_ENCRYPTION_KEY", None)
    if not key:
        key = Fernet.generate_key()
        os.environ["DB_ENCRYPTION_KEY"] = key.decode("utf-8")
    return key


def decrypt(sas_token: str):
    key = get_key()
    if not key:
        return None
    cipher_suite = Fernet(key)
    plain_text = cipher_suite.decrypt(sas_token)
    return SecretStr(plain_text.decode("utf-8"))


def encrypt(sas_token: SecretStr):
    key = get_key()
    if not key:
        return None
    cipher_suite = Fernet(key)
    cipher_text = cipher_suite.encrypt(sas_token.get_secret_value().encode())
    return cipher_text.decode("utf-8")
