# backend/helpers/api/__init__.py  (mostrando só a parte relevante)
from flask import Blueprint
from flask_restful import Api
import os

api_bp = Blueprint("api", __name__, url_prefix="/api")
api = Api(api_bp)

def register_resources() -> None:
    from resources.auth_resource import AuthLoginResource
    from resources.usuario_resource import (
        UsuarioListResource, UsuarioDetailResource, MeResource, UsuarioDebugListResource
    )
    from resources.pet_resource import (
        PetListResource, PetDetailResource, VacinaListResource  # mantém import da lista
    )
    from resources.vacina_resource import VacinaDetailResource  # <— NOVO

    # Auth
    api.add_resource(AuthLoginResource, "/auth/login")

    # Usuário
    api.add_resource(UsuarioListResource, "/usuario")
    api.add_resource(UsuarioDetailResource, "/usuario/<int:user_id>")
    api.add_resource(MeResource, "/me")

    # Pets/Vacinas
    api.add_resource(PetListResource, "/pets")
    api.add_resource(PetDetailResource, "/pets/<int:pet_id>")
    api.add_resource(VacinaListResource, "/pets/<int:pet_id>/vacinas")  # GET/POST (lista/cria)
    api.add_resource(VacinaDetailResource, "/pets/<int:pet_id>/vacinas/<int:vacina_id>")  # GET/PUT/DELETE

    if os.environ.get("APP_ENV") == "dev":
        api.add_resource(UsuarioDebugListResource, "/_dev/users")
