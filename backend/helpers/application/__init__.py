import os
from datetime import timedelta
from pathlib import Path
from flask import Flask, jsonify
from marshmallow import ValidationError

from helpers.database import init_db
from helpers.cors import init_cors
from helpers.logging import logger
from helpers.api import api_bp, register_resources

def _sqlite_instance_uri() -> str:
    base_dir = Path(__file__).resolve().parents[2]  # .../backend/helpers/application
    instance_dir = base_dir.parent / "instance"
    instance_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{(instance_dir / 'meupet.db').as_posix()}"

def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    app.config.setdefault("SQLALCHEMY_DATABASE_URI", os.environ.get("DATABASE_URL", _sqlite_instance_uri()))
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    app.config.setdefault("SECRET_KEY", os.environ.get("SECRET_KEY", "dev-secret"))
    app.config.setdefault("JWT_SECRET", os.environ.get("JWT_SECRET", "123456789"))
    app.config.setdefault("JSON_SORT_KEYS", False)
    app.config.setdefault("PERMANENT_SESSION_LIFETIME", timedelta(days=7))

    init_db(app)
    init_cors(app)

    # API v1
    register_resources()
    app.register_blueprint(api_bp)

    @app.get("/health")
    def health():
        return jsonify(status="ok"), 200

    # handlers comuns
    @app.errorhandler(404)
    def handle_404(err):
        return jsonify(error="Not Found"), 404

    @app.errorhandler(ValidationError)
    def handle_mm_error(err):
        return jsonify({"errors": err.messages}), 400

    @app.errorhandler(500)
    def handle_500(err):
        logger.exception("Erro interno: %s", err)
        return jsonify(error="Internal Server Error"), 500

    logger.info("MeuPet inicializado.")
    return app
