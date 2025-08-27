from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import event
from sqlalchemy.engine import Engine

db = SQLAlchemy()
migrate = Migrate()

# Liga PRAGMA foreign_keys=ON em conexões SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        from sqlite3 import Connection as SQLite3Connection
        if isinstance(dbapi_connection, SQLite3Connection):
            cur = dbapi_connection.cursor()
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()
    except Exception:
        # silencioso: se não for SQLite, ignora
        pass

def init_db(app):
    db.init_app(app)
    migrate.init_app(app, db)
