"""
Add GST compliance fields: hsn_sac on products/invoice_items, invoice_number and tax breakup on invoices
"""

from sqlalchemy import text


def up(conn) -> None:
    # Products: HSN/SAC code
    existing_products = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'")
        ).fetchall()
    }
    if "hsn_sac" not in existing_products:
        conn.execute(text("ALTER TABLE products ADD COLUMN hsn_sac VARCHAR"))

    # Invoice items: HSN/SAC snapshot
    existing_items = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoice_items'")
        ).fetchall()
    }
    if "hsn_sac" not in existing_items:
        conn.execute(text("ALTER TABLE invoice_items ADD COLUMN hsn_sac VARCHAR"))

    # Invoices: invoice_number and tax breakup
    existing_invoices = {
        row[0]
        for row in conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices'")
        ).fetchall()
    }

    invoice_cols = {
        "invoice_number": "ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR",
        "taxable_amount": "ALTER TABLE invoices ADD COLUMN taxable_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
        "total_tax_amount": "ALTER TABLE invoices ADD COLUMN total_tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
        "cgst_amount": "ALTER TABLE invoices ADD COLUMN cgst_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
        "sgst_amount": "ALTER TABLE invoices ADD COLUMN sgst_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
        "igst_amount": "ALTER TABLE invoices ADD COLUMN igst_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
    }

    for name, stmt in invoice_cols.items():
        if name not in existing_invoices:
            conn.execute(text(stmt))

    # Backfill invoice_number for existing rows
    conn.execute(text(
        "UPDATE invoices SET invoice_number = 'INV-' || LPAD(id::text, 6, '0') WHERE invoice_number IS NULL"
    ))


def down(conn) -> None:
    conn.execute(text("ALTER TABLE products DROP COLUMN IF EXISTS hsn_sac"))
    conn.execute(text("ALTER TABLE invoice_items DROP COLUMN IF EXISTS hsn_sac"))
    for col in ["invoice_number", "taxable_amount", "total_tax_amount",
                "cgst_amount", "sgst_amount", "igst_amount"]:
        conn.execute(text(f"ALTER TABLE invoices DROP COLUMN IF EXISTS {col}"))
