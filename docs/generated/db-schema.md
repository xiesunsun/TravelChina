# DB Schema

Generated from SQLAlchemy metadata.

## travel_records

| Column | Type | Nullable |
|---|---|---|
| id | VARCHAR(36) | False |
| user_id | VARCHAR(36) | False |
| province | VARCHAR(50) | False |
| city | VARCHAR(100) | True |
| spot_name | VARCHAR(100) | True |
| travel_date | DATE | False |
| weather | VARCHAR(20) | True |
| thoughts | TEXT | True |
| images | JSON | True |
| ai_tags | JSON | True |
| created_at | DATETIME | True |
| updated_at | DATETIME | True |

## users

| Column | Type | Nullable |
|---|---|---|
| id | VARCHAR(36) | False |
| username | VARCHAR(50) | False |
| hashed_password | VARCHAR(255) | False |
| is_active | BOOLEAN | True |
| created_at | DATETIME | True |
