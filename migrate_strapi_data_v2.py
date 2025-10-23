#!/usr/bin/env python3
"""
Script per migrare dati da SQLite locale a PostgreSQL su Neon - Versione 2
"""
import sqlite3
import psycopg2
from psycopg2.extras import Json
import json

# Configurazione
SQLITE_DB = '/Users/pasqualelucci/Desktop/omnilypro/.tmp/data.db'
POSTGRES_CONN = "postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

def migrate_templates(sqlite_conn, pg_conn):
    """Migra website_templates"""
    print("\n" + "="*60)
    print("FASE 1: Migrando website_templates")
    print("="*60)

    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Leggi tutti i template da SQLite
    sqlite_cursor.execute("SELECT * FROM website_templates")
    rows = sqlite_cursor.fetchall()

    print(f"\n📋 Trovati {len(rows)} template da migrare...")

    for row in rows:
        row_dict = dict(row)
        print(f"\n  Migrando: {row_dict['nome']}")

        # Prepara i dati per PostgreSQL (solo le colonne che esistono su PG)
        insert_query = """
            INSERT INTO website_templates (id, document_id, nome, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            row_dict['id'],
            row_dict['document_id'],
            row_dict['nome'],
            row_dict['created_at'],
            row_dict['updated_at'],
            row_dict['published_at'],
            row_dict['created_by_id'],
            row_dict['updated_by_id'],
            row_dict['locale']
        )

        try:
            pg_cursor.execute(insert_query, values)
            print(f"  ✓ Template '{row_dict['nome']}' migrato con successo")
        except Exception as e:
            print(f"  ✗ Errore: {e}")

    pg_conn.commit()
    print("✅ Completato website_templates")

def migrate_organization_websites(sqlite_conn, pg_conn):
    """Migra organization_websites"""
    print("\n" + "="*60)
    print("FASE 2: Migrando organization_websites")
    print("="*60)

    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Leggi tutti i siti da SQLite
    sqlite_cursor.execute("SELECT * FROM organization_websites")
    rows = sqlite_cursor.fetchall()

    print(f"\n📋 Trovati {len(rows)} siti da migrare...")

    for row in rows:
        row_dict = dict(row)
        print(f"\n  Migrando: {row_dict['nome']}")

        # Converti contenuto JSON se è stringa
        contenuto = row_dict['contenuto']
        if isinstance(contenuto, str):
            try:
                contenuto = json.loads(contenuto)
            except:
                pass

        insert_query = """
            INSERT INTO organization_websites
            (id, document_id, subdomain, organization_id, nome, contenuto, is_published, is_maintenance,
             custom_domain, seo_title, seo_description, seo_keywords, analytics_id,
             created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            row_dict['id'],
            row_dict['document_id'],
            row_dict['subdomain'],
            row_dict['organization_id'],
            row_dict['nome'],
            Json(contenuto),
            row_dict['is_published'],
            row_dict['is_maintenance'],
            row_dict['custom_domain'],
            row_dict['seo_title'],
            row_dict['seo_description'],
            row_dict['seo_keywords'],
            row_dict['analytics_id'],
            row_dict['created_at'],
            row_dict['updated_at'],
            row_dict['published_at'],
            row_dict['created_by_id'],
            row_dict['updated_by_id'],
            row_dict['locale']
        )

        try:
            pg_cursor.execute(insert_query, values)
            print(f"  ✓ Sito '{row_dict['nome']}' migrato con successo")
        except Exception as e:
            print(f"  ✗ Errore: {e}")

    pg_conn.commit()
    print("✅ Completato organization_websites")

def migrate_template_links(sqlite_conn, pg_conn):
    """Migra le relazioni tra siti e template"""
    print("\n" + "="*60)
    print("FASE 3: Migrando relazioni template")
    print("="*60)

    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Leggi le relazioni da SQLite
    sqlite_cursor.execute("SELECT * FROM organization_websites_template_lnk")
    rows = sqlite_cursor.fetchall()

    print(f"\n📋 Trovate {len(rows)} relazioni da migrare...")

    for row in rows:
        row_dict = dict(row)

        insert_query = """
            INSERT INTO organization_websites_template_lnk
            (id, organization_website_id, website_template_id, organization_website_ord)
            VALUES (%s, %s, %s, %s)
        """
        values = (
            row_dict['id'],
            row_dict['organization_website_id'],
            row_dict['website_template_id'],
            row_dict.get('organization_website_ord')
        )

        try:
            pg_cursor.execute(insert_query, values)
            print(f"  ✓ Relazione {row_dict['id']} migrata")
        except Exception as e:
            print(f"  ✗ Errore: {e}")

    pg_conn.commit()
    print("✅ Completato relazioni")

def main():
    print("🚀 Inizio migrazione dati Strapi da SQLite a PostgreSQL...")

    # Connetti ai database
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    pg_conn = psycopg2.connect(POSTGRES_CONN)

    try:
        # Migra in ordine
        migrate_templates(sqlite_conn, pg_conn)
        migrate_organization_websites(sqlite_conn, pg_conn)
        migrate_template_links(sqlite_conn, pg_conn)

        print("\n" + "="*60)
        print("✅ MIGRAZIONE COMPLETATA CON SUCCESSO!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ ERRORE durante la migrazione: {e}")
        import traceback
        traceback.print_exc()
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main()
