"""
Add buyer/company snapshot columns to invoices
"""

from sqlalchemy import text


def up(conn) -> None:
    columns = {
        "buyer_id": "ALTER TABLE invoices ADD COLUMN buyer_id INTEGER",
        "buyer_name": "ALTER TABLE invoices ADD COLUMN buyer_name VARCHAR",
        "buyer_address": "ALTER TABLE invoices ADD COLUMN buyer_address VARCHAR",
        "buyer_gst": "ALTER TABLE invoices ADD COLUMN buyer_gst VARCHAR",
        "buyer_phone": "ALTER TABLE invoices ADD COLUMN buyer_phone VARCHAR",
        "voucher_type": "ALTER TABLE invoices ADD COLUMN voucher_type VARCHAR NOT NULL DEFAULT 'sales'",
        "company_name": "ALTER TABLE invoices ADD COLUMN company_name VARCHAR",
        "company_address": "ALTER TABLE invoices ADD COLUMN company_address VARCHAR",
        "company_gst": "ALTER TABLE invoices ADD COLUMN company_gst VARCHAR",
        "company_phone": "ALTER TABLE invoices ADD COLUMN company_phone VARCHAR",
        "company_email": "ALTER TABLE invoices ADD COLUMN company_email VARCHAR",
        "company_website": "ALTER TABLE invoices ADD COLUMN company_website VARCHAR",
        "company_currency_code": "ALTER TABLE invoices ADD COLUMN company_currency_code VARCHAR",
        "company_bank_name": "ALTER TABLE invoices ADD COLUMN company_bank_name VARCHAR",
        "company_branch_name": "ALTER TABLE invoices ADD COLUMN company_branch_name VARCHAR",
        "company_account_name": "ALTER TABLE invoices ADD COLUMN company_account_name VARCHAR",
        "company_account_number": "ALTER TABLE invoices ADD COLUMN company_account_number VARCHAR",
        "company_ifsc_code": "ALTER TABLE invoices ADD COLUMN company_ifsc_code VARCHAR",
    }

    existing = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices'")
        ).fetchall()
    }

    for name, stmt in columns.items():
        if name not in existing:
            conn.execute(text(stmt))

    # Legacy compat: relax customer_name NOT NULL if present
    customer_col = conn.execute(
        text("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_name'")
    ).fetchone()
    if customer_col and customer_col[0] == "NO":
        conn.execute(text("ALTER TABLE invoices ALTER COLUMN customer_name DROP NOT NULL"))


def down(conn) -> None:
    drop_cols = [
        "buyer_id", "buyer_name", "buyer_address", "buyer_gst", "buyer_phone",
        "voucher_type",
        "company_name", "company_address", "company_gst", "company_phone",
        "company_email", "company_website", "company_currency_code",
        "company_bank_name", "company_branch_name", "company_account_name",
        "company_account_number", "company_ifsc_code",
    ]
    for col in drop_cols:
        conn.execute(text(f"ALTER TABLE invoices DROP COLUMN IF EXISTS {col}"))
