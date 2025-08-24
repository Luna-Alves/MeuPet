import re
from datetime import date
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, validates, ValidationError, pre_load, validates_schema
from sqlalchemy import func
from models.pet import Pet

PET_ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$')

class PetSchema(SQLAlchemyAutoSchema):
    data = fields.Date(required=True, data_key='data', attribute='data_ref')
    usuario_id = fields.Integer(dump_only=True)

    class Meta:
        model = Pet
        load_instance = True
        include_fk = False
        exclude = ('data_ref',)

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

    @validates_schema(pass_original=True)
    def check_peso_decimal(self, data, original_data, **kwargs):
        raw = original_data.get('peso')
        if raw is None or raw == '':
            raise ValidationError({'peso': ['Obrigatório.']})
        if isinstance(raw, (int, float)):
            if float(raw) <= 0:
                raise ValidationError({'peso': ['Deve ser maior que zero.']})
            if isinstance(raw, int) or (isinstance(raw, float) and float(raw).is_integer()):
                raise ValidationError({'peso': ['Informe com casas decimais, ex.: 7.5']})
        else:
            s = str(raw).replace(',', '.').strip()
            if not re.fullmatch(r'\d+\.\d+', s):
                raise ValidationError({'peso': ['Informe com casas decimais, ex.: 7.5']})
            if float(s) <= 0:
                raise ValidationError({'peso': ['Deve ser maior que zero.']})

    @validates('data')
    def v_data(self, v, **kwargs):
        if v > date.today():
            raise ValidationError('Não pode ser no futuro.')

    @validates('cor_pelagem')
    def v_cor(self, v, **kwargs):
        s = (v or '').strip()
        if not s:
            raise ValidationError('Obrigatório.')
        if not PET_ONLY_LETTERS.fullmatch(s):
            raise ValidationError('Use apenas letras (sem números).')
