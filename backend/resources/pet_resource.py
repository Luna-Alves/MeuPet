from flask import request, jsonify, g
from flask_restful import Resource
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError

from helpers.database import db
from models.pet import Pet
from models.vacina import Vacina
from schemas import pet_schema, pets_schema, vacina_schema, vacinas_schema
from resources.auth_utils import login_required

class PetListResource(Resource):
    method_decorators = [login_required]

    def get(self):
        pets = (Pet.query
                .filter_by(usuario_id=g.current_user_id)
                .order_by(func.lower(Pet.nome))
                .all())
        return pets_schema.dump(pets), 200

    def post(self):
        try:
            payload = request.get_json(force=True) or {}
            pet = pet_schema.load(payload, session=db.session)

            nome_norm = (pet.nome or "").strip()
            if not nome_norm:
                return {"errors": {"nome": ["Campo obrigatório."]}}, 400

            exists = (Pet.query
                      .filter(Pet.usuario_id == g.current_user_id,
                              func.lower(Pet.nome) == func.lower(nome_norm))
                      .first())
            if exists:
                return {"errors": {"nome": ["Você já possui um pet com esse nome."]}}, 409

            pet.nome = nome_norm
            pet.usuario_id = g.current_user_id
            db.session.add(pet)
            db.session.commit()
            return pet_schema.dump(pet), 201

        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500

class PetDetailResource(Resource):
    method_decorators = [login_required]

    def get(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        return pet_schema.dump(pet), 200

class VacinaListResource(Resource):
    method_decorators = [login_required]

    def get(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        vacs = Vacina.query.filter_by(pet_id=pet.id).order_by(Vacina.data_aplicacao.desc()).all()
        return vacinas_schema.dump(vacs), 200

    def post(self, pet_id):
        try:
            pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
            payload = request.get_json(force=True)
            vac = vacina_schema.load(payload, session=db.session)
            vac.pet_id = pet.id
            db.session.add(vac)
            db.session.commit()
            return vacina_schema.dump(vac), 201
        except ValidationError as err:
            return {"errors": err.messages}, 400
