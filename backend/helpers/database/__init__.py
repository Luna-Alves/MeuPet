from __future__ import annotations
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db: SQLAlchemy = SQLAlchemy()
migrate: Migrate = Migrate()

def init_db(app) -> None:
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    app.config.setdefault("SQLALCHEMY_ENGINE_OPTIONS", {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    })
    db.init_app(app)
    migrate.init_app(app, db)
