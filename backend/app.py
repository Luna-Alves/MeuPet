# backend/app.py
from helpers.application import create_app
from helpers.database import db

app = create_app()

if __name__ == "__main__":
    from models import *  # garante que as models estão no metadata
    with app.app_context():
        db.create_all()
    app.run(host="127.0.0.1", port=5500, debug=True)
