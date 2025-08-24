import os, sqlite3

db = os.path.join(os.path.dirname(__file__), "meupet.db")
con = sqlite3.connect(db)
cur = con.cursor()

def add(col, ddl):
    try:
        cur.execute(f"ALTER TABLE vacina ADD COLUMN {col} {ddl}")
        print(f"OK: {col}")
    except sqlite3.OperationalError as e:
        msg = str(e).lower()
        if "duplicate column name" in msg:
            print(f"Já existe: {col}")
        elif "no such table" in msg:
            print("Tabela 'vacina' não existe. Rode o backend para criar com db.create_all() ou faça DROP/CREATE.")
            raise
        else:
            raise

for col, ddl in [
    ("fabricante","TEXT"),
    ("data_aplicacao","DATE"),
    ("data_fabricacao","DATE"),
    ("data_vencimento","DATE"),
    ("data_revac","DATE"),
    ("lote","TEXT"),
    ("dose_tamanho","TEXT"),
    ("observacoes","TEXT"),
]:
    add(col, ddl)

con.commit()
con.close()
print("Migração finalizada.")
