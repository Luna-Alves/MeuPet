# backend/schemas/vacina.py
from datetime import date
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, validates_schema, ValidationError, EXCLUDE
from models.vacina import Vacina

class VacinaSchema(SQLAlchemyAutoSchema):
    # campos texto
    nome          = fields.String(required=True)
    fabricante    = fields.String(required=True)
    lote          = fields.String(required=True)
    dose_tamanho  = fields.String(required=True)
    observacoes   = fields.String(allow_none=True)

    # datas com nomes amigáveis no JSON
    aplicacao   = fields.Date(required=True, data_key='aplicacao',   attribute='data_aplicacao')
    fabricacao  = fields.Date(required=True, data_key='fabricacao',  attribute='data_fabricacao')
    vencimento  = fields.Date(required=True, data_key='vencimento',  attribute='data_vencimento')
    revacinacao = fields.Date(required=True, data_key='revacinacao', attribute='data_revac')

    pet_id = fields.Integer(dump_only=True)

    class Meta:
        model = Vacina
        load_instance = True
        include_fk = False
        unknown = EXCLUDE
        # evitamos duplicidade dos campos internos
        exclude = ('data_aplicacao', 'data_fabricacao', 'data_vencimento', 'data_revac')

    @validates_schema
    def check_dates(self, data, **kwargs):
        """
        Validação aware de UPDATE:
        - Em update, mescla com a instância atual (context['db_instance'])
        - Regras: 
          * aplicação e fabricação não no futuro
          * aplicação >= fabricação
          * vencimento >= max(fabricação, aplicação)
          * revacinação  > aplicação
        """
        today = date.today()
        inst = self.context.get("db_instance")

        # valores finais após mescla (payload > instância)
        fab = data.get('fabricacao',  getattr(inst, 'data_fabricacao',  None) if inst else None)
        apl = data.get('aplicacao',   getattr(inst, 'data_aplicacao',   None) if inst else None)
        ven = data.get('vencimento',  getattr(inst, 'data_vencimento',  None) if inst else None)
        rev = data.get('revacinacao', getattr(inst, 'data_revac',       None) if inst else None)

        errors = {}

        if fab and fab > today:
            errors.setdefault('fabricacao', []).append('Não pode ser no futuro.')
        if apl and apl > today:
            errors.setdefault('aplicacao', []).append('Não pode ser no futuro.')

        if fab and apl and apl < fab:
            errors.setdefault('aplicacao', []).append('Aplicação não pode ser anterior à fabricação.')

        if fab and ven and ven < fab:
            errors.setdefault('vencimento', []).append('Vencimento deve ser após fabricação.')
        if apl and ven and ven < apl:
            errors.setdefault('vencimento', []).append('Vencimento deve ser após aplicação.')

        if apl and rev and rev <= apl:
            errors.setdefault('revacinacao', []).append('Revacinação deve ser posterior à aplicação.')

        if errors:
            raise ValidationError(errors)
