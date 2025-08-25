# backend/resources/usuario_resource.py
import os
from flask import request, g
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError

from helpers.database import db
from models.usuario import Usuario
from schemas import usuario_create_schema, usuario_schema, usuarios_schema
from resources.auth_utils import gerar_token, login_required


class UsuarioListResource(Resource):
    def get(self):
        users = Usuario.query.all()
        return usuarios_schema.dump(users), 200

    def post(self):
        try:
            payload = request.get_json(force=True)
            usuario = usuario_create_schema.load(payload, session=db.session)  # exige 'senha'
            db.session.add(usuario)
            db.session.commit()
            token = gerar_token(usuario)
            return {**usuario_schema.dump(usuario), "token": token}, 201

        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400

        except IntegrityError:
            db.session.rollback()
            return {"errors": {"email": ["Já cadastrado."]}}, 409

        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500


class UsuarioDetailResource(Resource):
    def get(self, user_id):
        u = Usuario.query.get_or_404(user_id)
        return usuario_schema.dump(u), 200


class MeResource(Resource):
    method_decorators = [login_required]

    def get(self):
        u = Usuario.query.get_or_404(g.current_user_id)
        return usuario_schema.dump(u), 200


# 🔧 Debug somente em dev
class UsuarioDebugListResource(Resource):
    def get(self):
        if os.environ.get("APP_ENV") != "dev":
            return {"error": "forbidden"}, 403
        users = Usuario.query.all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "senha_prefix": (u.senha or "")[:12],
                "len": len(u.senha or ""),
            }
            for u in users
        ], 200
