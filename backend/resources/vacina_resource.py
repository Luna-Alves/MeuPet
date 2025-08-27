# backend/resources/vacina_resource.py
from flask import request, g
from flask_restful import Resource
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from helpers.database import db
from models.pet import Pet
from models.vacina import Vacina
from schemas import vacina_schema, vacinas_schema
from resources.auth_utils import login_required

class VacinaListResource(Resource):
    method_decorators = [login_required]

    def get(self, pet_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        vacs = Vacina.query.filter_by(pet_id=pet.id).order_by(Vacina.data_aplicacao.desc()).all()
        return vacinas_schema.dump(vacs), 200

    def post(self, pet_id):
        try:
            pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
            payload = request.get_json(force=True) or {}
            vac = vacina_schema.load(payload, session=db.session)
            vac.pet_id = pet.id
            db.session.add(vac)
            db.session.commit()
            return vacina_schema.dump(vac), 201
        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400
        except IntegrityError:
            db.session.rollback()
            return {"errors": {"_": ["Conflito ao salvar vacina."]}}, 409
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500


class VacinaDetailResource(Resource):
    method_decorators = [login_required]

    def _get_pet_and_vac(self, pet_id, vacina_id):
        pet = Pet.query.filter_by(id=pet_id, usuario_id=g.current_user_id).first_or_404()
        vac = Vacina.query.filter_by(id=vacina_id, pet_id=pet.id).first_or_404()
        return pet, vac

    def get(self, pet_id, vacina_id):
        _, vac = self._get_pet_and_vac(pet_id, vacina_id)
        return vacina_schema.dump(vac), 200

    def put(self, pet_id, vacina_id):
        _, vac = self._get_pet_and_vac(pet_id, vacina_id)
        try:
            payload = request.get_json(force=True) or {}

            # Não permitir edição destes campos:
            if 'nome' in payload and (payload['nome'] or '').strip() != vac.nome:
                return {"errors": {"nome": ["Este campo não pode ser alterado."]}}, 400

            if 'aplicacao' in payload:
                # aceita '', null ou a mesma data; qualquer outro valor é bloqueado
                req = payload['aplicacao']
                current_iso = vac.data_aplicacao.isoformat() if vac.data_aplicacao else None
                if req not in (None, "", current_iso):
                    return {"errors": {"aplicacao": ["Este campo não pode ser alterado."]}}, 400
                payload.pop('aplicacao', None)

            # Campos permitidos para edição
            ALLOWED = {
                "fabricante", "fabricacao", "vencimento",
                "lote", "dose_tamanho", "revacinacao", "observacoes"
            }
            clean = {k: v for k, v in payload.items() if k in ALLOWED}

            # Contexto para o schema mesclar datas com a instância
            vacina_schema.context = {"db_instance": vac}
            vac = vacina_schema.load(clean, session=db.session, instance=vac, partial=True)
            vacina_schema.context = {}

            db.session.commit()
            return vacina_schema.dump(vac), 200

        except ValidationError as err:
            db.session.rollback()
            return {"errors": err.messages}, 400
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500

    def delete(self, pet_id, vacina_id):
        _, vac = self._get_pet_and_vac(pet_id, vacina_id)
        try:
            db.session.delete(vac)
            db.session.commit()
            return {"ok": True}, 204
        except Exception as e:
            db.session.rollback()
            return {"errors": {"_": [str(e)]}}, 500
