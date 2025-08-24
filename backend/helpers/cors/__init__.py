import os
from flask_cors import CORS

def init_cors(app) -> None:
    origins_env = os.environ.get("FRONTEND_ORIGINS", "")
    if origins_env.strip():
        origins = [o.strip() for o in origins_env.split(",") if o.strip()]
    else:
        origins = ["*"]  # dev
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=True,
        expose_headers=["Authorization"],
        allow_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        max_age=86400,
    )
