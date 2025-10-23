#!/usr/bin/env python3
import sqlite3
import psycopg2
from psycopg2.extras import Json
import json
from datetime import datetime

SQLITE_DB = '/Users/pasqualelucci/Desktop/omnilypro/.tmp/data.db'
POSTGRES_CONN = "postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

def convert_timestamp(ts):
    """Converti timestamp millisecondi a datetime"""
    if ts is None:
        return None
    # Se è > 10^10 è in millisecondi
    if ts > 10000000000:
        ts = ts / 1000
    return datetime.fromtimestamp(ts)

def convert_bool(val):
    """Converti 0/1 a boolean"""
    return bool(val) if val is not None else None

sqlite_conn = sqlite3.connect(SQLITE_DB)
sqlite_conn.row_factory = sqlite3.Row
pg_conn = psycopg2.connect(POSTGRES_CONN)
pg_cursor = pg_conn.cursor()

try:
    # 1. Migra template
    print("Migrando template...")
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT * FROM website_templates")
    for row in sqlite_cursor.fetchall():
        r = dict(row)
        pg_cursor.execute("""
            INSERT INTO website_templates (id, document_id, nome, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (r['id'], r['document_id'], r['nome'],
              convert_timestamp(r['created_at']), convert_timestamp(r['updated_at']),
              convert_timestamp(r['published_at']), r['created_by_id'], r['updated_by_id'], r['locale']))
        print(f"  ✓ {r['nome']}")

    # 2. Migra siti
    print("\nMigrando siti...")
    sqlite_cursor.execute("SELECT * FROM organization_websites")
    for row in sqlite_cursor.fetchall():
        r = dict(row)
        contenuto = json.loads(r['contenuto']) if isinstance(r['contenuto'], str) else r['contenuto']
        pg_cursor.execute("""
            INSERT INTO organization_websites
            (id, document_id, subdomain, organization_id, nome, contenuto, is_published, is_maintenance,
             custom_domain, seo_title, seo_description, seo_keywords, analytics_id,
             created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (r['id'], r['document_id'], r['subdomain'], r['organization_id'], r['nome'],
              Json(contenuto), convert_bool(r['is_published']), convert_bool(r['is_maintenance']),
              r['custom_domain'], r['seo_title'], r['seo_description'], r['seo_keywords'], r['analytics_id'],
              convert_timestamp(r['created_at']), convert_timestamp(r['updated_at']),
              convert_timestamp(r['published_at']), r['created_by_id'], r['updated_by_id'], r['locale']))
        print(f"  ✓ {r['nome']}")

    # 3. Migra relazioni
    print("\nMigrando relazioni...")
    sqlite_cursor.execute("SELECT * FROM organization_websites_template_lnk")
    for row in sqlite_cursor.fetchall():
        r = dict(row)
        pg_cursor.execute("""
            INSERT INTO organization_websites_template_lnk (id, organization_website_id, website_template_id)
            VALUES (%s, %s, %s)
        """, (r['id'], r['organization_website_id'], r['website_template_id']))
        print(f"  ✓ Relazione {r['id']}")

    pg_conn.commit()
    print("\n✅ MIGRAZIONE COMPLETATA!")

except Exception as e:
    print(f"\n❌ ERRORE: {e}")
    import traceback
    traceback.print_exc()
    pg_conn.rollback()
finally:
    sqlite_conn.close()
    pg_conn.close()
