from flask import Blueprint
from flask_restful import Api

api_bp = Blueprint("api", __name__, url_prefix="/api")
api = Api(api_bp)

def register_resources() -> None:
    # importe só aqui para evitar import circular
    from resources.auth_resource import AuthLoginResource
    from resources.usuario_resource import UsuarioListResource, UsuarioDetailResource, MeResource
    from resources.pet_resource import PetListResource, PetDetailResource, VacinaListResource

    api.add_resource(AuthLoginResource, "/auth/login")
    api.add_resource(UsuarioListResource, "/usuario")                 # GET, POST
    api.add_resource(UsuarioDetailResource, "/usuario/<int:user_id>") # GET
    api.add_resource(MeResource, "/me")                                # GET

    api.add_resource(PetListResource, "/pets")                         # GET, POST (autenticado)
    api.add_resource(PetDetailResource, "/pets/<int:pet_id>")          # GET (autenticado)
    api.add_resource(VacinaListResource, "/pets/<int:pet_id>/vacinas") # GET, POST (autenticado)
