# backend/resources/pet_resource.py
from flask import request, g
from flask_restful import Resource
from sqlalchemy import func
from marshmallow import ValidationError

from helpers.database import db
from models.pet import Pet
from models.vacina import Vacina
from schemas import pet_schema, pets_schema, vacina_schema, vacinas_schema
from resources.auth_utils import login_required


class PetListResource(Resource):
    method_decorators = [login_required]

    def get(self):
        pets = (
            Pet.query
            .filter_by(usuario_id=g.current_user_id)
            .order_by(func.lower(Pet.nome))
            .all()
        )
        return pets_schema.dump(pets), 200

    def post(self):
        try:
            payload = request.get_json(force=True) or {}
            pet = pet_schema.load(payload, session=db.session)

            # normaliza/checa nome por usuário (case-insensitive)
            nome_norm = (pet.nome or "").strip()
            if not nome_norm:
                return {"errors": {"nome": ["Campo obrigatório."]}}, 400

            exists = (
                Pet.query
                .filter(Pet.usuario_id == g.current_user_id,
                        func.lower(Pet.nome) == func.lower(nome_norm))
                .first()
            )
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

    # backend/resources/pet_resource.py (apenas o método put)

    # backend/resources/pet_resource.py (trecho do método put)

    def put(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        try:
            payload = request.get_json(force=True) or {}

            # Campos editáveis
            ALLOWED = {
                "especie", "porte", "peso", "raca", "cor_pelagem",
                "idade_aproximada", "outras_caracteristicas", "data_chegada"
            }

            # Imutáveis
            if 'nome' in payload and (payload['nome'] or "").strip() != pet.nome:
                return {"errors": {"nome": ["Este campo não pode ser alterado."]}}, 400

            if 'data_nascimento' in payload:
                req_val = payload['data_nascimento'] or None
                current_iso = pet.data_nascimento.isoformat() if pet.data_nascimento else None
                if req_val not in (None, "", current_iso):
                    return {"errors": {"data_nascimento": ["Este campo não pode ser alterado."]}}, 400
                payload.pop('data_nascimento', None)

            # Filtra e normaliza
            clean = {k: v for k, v in payload.items() if k in ALLOWED}
            if 'peso' in clean and isinstance(clean['peso'], str):
                clean['peso'] = clean['peso'].replace(',', '.').strip()
            for k in ('idade_aproximada', 'outras_caracteristicas'):
                if k in clean and isinstance(clean[k], str) and clean[k].strip() == '':
                    clean[k] = None
            if 'data_chegada' in clean and clean['data_chegada'] == '':
                clean['data_chegada'] = None

            # <-- passa a instância atual no context para o schema mesclar
            pet_schema.context = {"db_instance": pet}
            pet = pet_schema.load(clean, session=db.session, instance=pet, partial=True)
            pet_schema.context = {}  # limpa o context para não "vazar" entre requests

            db.session.commit()
            return pet_schema.dump(pet), 200

        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500

    def delete(self, pet_id):
        """
        Exclui o pet e, por cascade (all, delete-orphan), TODAS as vacinas ligadas a ele.
        """
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        try:
            db.session.delete(pet)
            db.session.commit()
            # 204 sem corpo
            return "", 204
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500


class VacinaListResource(Resource):
    method_decorators = [login_required]

    def get(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        vacs = (
            Vacina.query
            .filter_by(pet_id=pet.id)
            .order_by(Vacina.data_aplicacao.desc())
            .all()
        )
        return vacinas_schema.dump(vacs), 200

    def post(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        try:
            payload = request.get_json(force=True)
            vac = vacina_schema.load(payload, session=db.session)
            vac.pet_id = pet.id
            db.session.add(vac)
            db.session.commit()
            return vacina_schema.dump(vac), 201
        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500
