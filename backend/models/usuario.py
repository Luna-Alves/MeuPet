from helpers.database import db

class Usuario(db.Model):
    __tablename__ = "usuario"
    __table_args__ = {"sqlite_autoincrement": True}  # impede reuso de IDs

    id       = db.Column(db.Integer, primary_key=True)
    nome     = db.Column(db.String(120), nullable=False)
    data     = db.Column(db.Date, nullable=False)
    rua      = db.Column(db.String(200), nullable=False)
    bairro   = db.Column(db.String(100), nullable=False)
    numero   = db.Column(db.String(20), nullable=False)
    cep      = db.Column(db.String(20), nullable=False)
    cidade   = db.Column(db.String(100), nullable=False)
    estado   = db.Column(db.String(2), nullable=False)
    complemento = db.Column(db.String(200))
    funcao   = db.Column(db.String(10), nullable=False)
    email    = db.Column(db.String(120), unique=True, nullable=False)
    senha    = db.Column(db.String(255), nullable=False)

    # relação -> pets com cascade
    pets = db.relationship(
        "Pet",
        back_populates="usuario",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
