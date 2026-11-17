"""
Add gst_rate to products
"""

from sqlalchemy import text


def up(conn) -> None:
    existing = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'")
        ).fetchall()
    }

    if "gst_rate" not in existing:
        conn.execute(text("ALTER TABLE products ADD COLUMN gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0"))


def down(conn) -> None:
    conn.execute(text("ALTER TABLE products DROP COLUMN IF EXISTS gst_rate"))
