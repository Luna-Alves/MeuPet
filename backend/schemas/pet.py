# backend/schemas/pet.py
import re
from datetime import date
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import (
    fields, validates, ValidationError, pre_load, validates_schema, EXCLUDE
)
from models.pet import Pet

PET_ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$')

class PetSchema(SQLAlchemyAutoSchema):
    data_nascimento = fields.Date(allow_none=True)
    data_chegada    = fields.Date(allow_none=True)
    usuario_id      = fields.Integer(dump_only=True)

    class Meta:
        model = Pet
        load_instance = True
        include_fk = False
        unknown = EXCLUDE  # ignora chaves desconhecidas

    @pre_load
    def normalize(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        if 'peso' in data and isinstance(data['peso'], str):
            data['peso'] = data['peso'].replace(',', '.').strip()
        for k in ('idade_aproximada', 'outras_caracteristicas'):
            if k in data and isinstance(data[k], str) and data[k].strip() == '':
                data[k] = None
        for k in ('nome', 'especie', 'porte', 'raca', 'cor_pelagem'):
            if k in data and isinstance(data[k], str):
                data[k] = data[k].strip()
        # normaliza string vazia em datas para None
        for k in ('data_nascimento', 'data_chegada'):
            if k in data and data[k] == '':
                data[k] = None
        return data

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """
        Regras:
        - CREATE: precisa ter pelo menos uma das datas.
        - UPDATE: permite não enviar datas. Mescla com a instância atual;
          só erra se após a mescla as duas ficarem vazias E o payload
          tocou explicitamente em alguma delas.
        - Futuro é proibido; chegada < nascimento é proibido (após mescla).
        """
        today = date.today()
        inst = self.context.get("db_instance")  # passado no recurso PUT

        # valores finais após mescla (payload > instância)
        nasc_final = data.get('data_nascimento', getattr(inst, 'data_nascimento', None) if inst else None)
        cheg_final = data.get('data_chegada',    getattr(inst, 'data_chegada',    None) if inst else None)

        # está editando se há instância
        is_update = inst is not None

        # o payload tocou explicitamente em alguma data?
        touched_any_date = ('data_nascimento' in data) or ('data_chegada' in data)

        # Regra "pelo menos uma data"
        if not nasc_final and not cheg_final:
            # Em CREATE (sem instância) ou em UPDATE *mexendo* em datas e zerando ambas -> erro
            if not is_update or touched_any_date:
                raise ValidationError({
                    'data_nascimento': ['Informe data de nascimento ou data de chegada.'],
                    'data_chegada':    ['Informe data de nascimento ou data de chegada.']
                })

        # Demais validações
        if nasc_final and nasc_final > today:
            raise ValidationError({'data_nascimento': ['Não pode ser no futuro.']})
        if cheg_final and cheg_final > today:
            raise ValidationError({'data_chegada': ['Não pode ser no futuro.']})
        if nasc_final and cheg_final and cheg_final < nasc_final:
            raise ValidationError({'data_chegada': ['Data de chegada não pode ser anterior à data de nascimento.']})

    @validates('cor_pelagem')
    def v_cor(self, v, **kwargs):
        s = (v or '').strip()
        if not s:
            raise ValidationError('Obrigatório.')
        if not PET_ONLY_LETTERS.fullmatch(s):
            raise ValidationError('Use apenas letras (sem números).')
