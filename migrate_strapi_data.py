#!/usr/bin/env python3
"""
Script per migrare dati da SQLite locale a PostgreSQL su Neon
"""
import sqlite3
import psycopg2
from psycopg2.extras import Json
import json

# Configurazione
SQLITE_DB = '/Users/pasqualelucci/Desktop/omnilypro/.tmp/data.db'
POSTGRES_CONN = "postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

def migrate_table(sqlite_conn, pg_conn, table_name, columns):
    """Migra una singola tabella da SQLite a PostgreSQL"""
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Leggi tutti i dati da SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()

    print(f"\n📋 Migrando {len(rows)} righe da {table_name}...")

    for row in rows:
        # Prepara i valori
        values = []
        for i, val in enumerate(row):
            # Gestisci tipi speciali
            if isinstance(val, str) and columns[i] in ['contenuto', 'editable_fields']:
                # Converti JSON string a dict per PostgreSQL
                try:
                    values.append(Json(json.loads(val)))
                except:
                    values.append(Json(val))
            else:
                values.append(val)

        # Costruisci query INSERT
        placeholders = ', '.join(['%s'] * len(values))
        insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

        try:
            pg_cursor.execute(insert_query, values)
            print(f"  ✓ Riga {row[0]} migrata")
        except Exception as e:
            print(f"  ✗ Errore migrando riga {row[0]}: {e}")

    pg_conn.commit()
    print(f"✅ Completato {table_name}")

def main():
    print("🚀 Inizio migrazione dati Strapi da SQLite a PostgreSQL...")

    # Connetti ai database
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    pg_conn = psycopg2.connect(POSTGRES_CONN)

    try:
        # Migra website_templates PRIMA (perché organization_websites dipende da questi)
        print("\n" + "="*60)
        print("FASE 1: Migrando website_templates")
        print("="*60)

        template_columns = [
            'id', 'document_id', 'nome', 'created_at', 'updated_at',
            'published_at', 'created_by_id', 'updated_by_id', 'locale'
        ]
        migrate_table(sqlite_conn, pg_conn, 'website_templates', template_columns)

        # Migra organization_websites
        print("\n" + "="*60)
        print("FASE 2: Migrando organization_websites")
        print("="*60)

        org_website_columns = [
            'id', 'document_id', 'subdomain', 'organization_id', 'nome',
            'contenuto', 'is_published', 'is_maintenance', 'custom_domain',
            'seo_title', 'seo_description', 'seo_keywords', 'analytics_id',
            'created_at', 'updated_at', 'published_at', 'created_by_id',
            'updated_by_id', 'locale'
        ]
        migrate_table(sqlite_conn, pg_conn, 'organization_websites', org_website_columns)

        # Migra la relazione template
        print("\n" + "="*60)
        print("FASE 3: Migrando relazioni template")
        print("="*60)

        relation_columns = [
            'id', 'organization_website_id', 'website_template_id',
            'organization_website_ord'
        ]
        migrate_table(sqlite_conn, pg_conn, 'organization_websites_template_lnk', relation_columns)

        print("\n" + "="*60)
        print("✅ MIGRAZIONE COMPLETATA CON SUCCESSO!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ ERRORE durante la migrazione: {e}")
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main()
