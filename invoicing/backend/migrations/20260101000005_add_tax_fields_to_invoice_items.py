"""
Add tax fields to invoice_items
"""

from sqlalchemy import text


def up(conn) -> None:
    columns = {
        "gst_rate": "ALTER TABLE invoice_items ADD COLUMN gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0",
        "taxable_amount": "ALTER TABLE invoice_items ADD COLUMN taxable_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
        "tax_amount": "ALTER TABLE invoice_items ADD COLUMN tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
    }

    existing = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoice_items'")
        ).fetchall()
    }

    for name, stmt in columns.items():
        if name not in existing:
            conn.execute(text(stmt))


def down(conn) -> None:
    for col in ["gst_rate", "taxable_amount", "tax_amount"]:
        conn.execute(text(f"ALTER TABLE invoice_items DROP COLUMN IF EXISTS {col}"))
