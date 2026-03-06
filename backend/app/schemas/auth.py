from pydantic import BaseModel, Field


USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 50
PASSWORD_MIN_LENGTH = 6
PASSWORD_MAX_LENGTH = 128


class RegisterRequest(BaseModel):
    username: str = Field(min_length=USERNAME_MIN_LENGTH, max_length=USERNAME_MAX_LENGTH)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class LoginRequest(BaseModel):
    username: str = Field(min_length=USERNAME_MIN_LENGTH, max_length=USERNAME_MAX_LENGTH)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class UserRead(BaseModel):
    id: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
