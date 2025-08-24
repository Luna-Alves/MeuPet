# Mantém imports centralizados (útil p/ Flask-Migrate autodescobrir modelos)
from .usuario import Usuario
from .pet import Pet
from .vacina import Vacina

__all__ = ["Usuario", "Pet", "Vacina"]
