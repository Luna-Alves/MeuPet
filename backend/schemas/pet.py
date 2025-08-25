import re
from datetime import date
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, validates, ValidationError, pre_load, validates_schema
from models.pet import Pet

PET_ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$')

class PetSchema(SQLAlchemyAutoSchema):
    data_nascimento = fields.Date(allow_none=True)
    data_chegada    = fields.Date(allow_none=True)

    usuario_id = fields.Integer(dump_only=True)

    class Meta:
        model = Pet
        load_instance = True
        include_fk = False

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
        return data

    @validates_schema
    def validate_dates(self, data, **kwargs):
        nasc = data.get('data_nascimento')
        cheg = data.get('data_chegada')
        today = date.today()

        if not nasc and not cheg:
            raise ValidationError({'data_nascimento': ['Informe data de nascimento ou data de chegada.'],
                                   'data_chegada':    ['Informe data de nascimento ou data de chegada.']})

        if nasc and nasc > today:
            raise ValidationError({'data_nascimento': ['Não pode ser no futuro.']})
        if cheg and cheg > today:
            raise ValidationError({'data_chegada': ['Não pode ser no futuro.']})
        if nasc and cheg and cheg < nasc:
            raise ValidationError({'data_chegada': ['Data de chegada não pode ser anterior à data de nascimento.']})

    @validates('cor_pelagem')
    def v_cor(self, v, **kwargs):
        s = (v or '').strip()
        if not s:
            raise ValidationError('Obrigatório.')
        if not PET_ONLY_LETTERS.fullmatch(s):
            raise ValidationError('Use apenas letras (sem números).')
