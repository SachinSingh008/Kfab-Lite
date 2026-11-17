"""
Add extended fields to buyers (ledgers)
"""

from sqlalchemy import text


def up(conn) -> None:
    columns = {
        "email": "ALTER TABLE buyers ADD COLUMN email VARCHAR",
        "website": "ALTER TABLE buyers ADD COLUMN website VARCHAR",
        "bank_name": "ALTER TABLE buyers ADD COLUMN bank_name VARCHAR",
        "branch_name": "ALTER TABLE buyers ADD COLUMN branch_name VARCHAR",
        "account_name": "ALTER TABLE buyers ADD COLUMN account_name VARCHAR",
        "account_number": "ALTER TABLE buyers ADD COLUMN account_number VARCHAR",
        "ifsc_code": "ALTER TABLE buyers ADD COLUMN ifsc_code VARCHAR",
    }

    existing = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'buyers'")
        ).fetchall()
    }

    for name, stmt in columns.items():
        if name not in existing:
            conn.execute(text(stmt))


def down(conn) -> None:
    for col in ["email", "website", "bank_name", "branch_name",
                "account_name", "account_number", "ifsc_code"]:
        conn.execute(text(f"ALTER TABLE buyers DROP COLUMN IF EXISTS {col}"))
