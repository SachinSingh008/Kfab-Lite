"""
Add extended fields to company_profiles
"""

from sqlalchemy import text


def up(conn) -> None:
    columns = {
        "currency_code": "ALTER TABLE company_profiles ADD COLUMN currency_code VARCHAR",
        "email": "ALTER TABLE company_profiles ADD COLUMN email VARCHAR",
        "website": "ALTER TABLE company_profiles ADD COLUMN website VARCHAR",
        "bank_name": "ALTER TABLE company_profiles ADD COLUMN bank_name VARCHAR",
        "branch_name": "ALTER TABLE company_profiles ADD COLUMN branch_name VARCHAR",
        "account_name": "ALTER TABLE company_profiles ADD COLUMN account_name VARCHAR",
        "account_number": "ALTER TABLE company_profiles ADD COLUMN account_number VARCHAR",
        "ifsc_code": "ALTER TABLE company_profiles ADD COLUMN ifsc_code VARCHAR",
    }

    existing = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'company_profiles'")
        ).fetchall()
    }

    for name, stmt in columns.items():
        if name not in existing:
            conn.execute(text(stmt))


def down(conn) -> None:
    for col in ["currency_code", "email", "website", "bank_name", "branch_name",
                "account_name", "account_number", "ifsc_code"]:
        conn.execute(text(f"ALTER TABLE company_profiles DROP COLUMN IF EXISTS {col}"))
