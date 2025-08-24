from .usuario import UsuarioSchema, UsuarioCreateSchema
from .pet import PetSchema
from .vacina import VacinaSchema

usuario_schema = UsuarioSchema()
usuario_create_schema = UsuarioCreateSchema()
usuarios_schema = UsuarioSchema(many=True)

pet_schema = PetSchema()
pets_schema = PetSchema(many=True)

vacina_schema = VacinaSchema()
vacinas_schema = VacinaSchema(many=True)
