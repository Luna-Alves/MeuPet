from datetime import datetime
from helpers.database import db

class Pet(db.Model):
    __tablename__ = "pet"
    __table_args__ = {"sqlite_autoincrement": True}

    id          = db.Column(db.Integer, primary_key=True)
    usuario_id  = db.Column(
        db.Integer,
        db.ForeignKey("usuario.id", ondelete="CASCADE"),
        nullable=False,
    )

    usuario     = db.relationship("Usuario", back_populates="pets")

    nome        = db.Column(db.String(120), nullable=False)

    data_nascimento = db.Column(db.Date, nullable=True)
    data_chegada    = db.Column(db.Date, nullable=True)

    especie     = db.Column(db.String(50), nullable=False)
    porte       = db.Column(db.String(20), nullable=False)
    peso        = db.Column(db.Float, nullable=False)
    raca        = db.Column(db.String(100), nullable=False)
    cor_pelagem = db.Column(db.String(100), nullable=False)

    idade_aproximada       = db.Column(db.String(50))
    outras_caracteristicas = db.Column(db.Text)
    criado_em              = db.Column(db.DateTime, default=datetime.utcnow)

    # vacinas do pet com cascade
    vacinas = db.relationship(
        "Vacina",
        back_populates="pet",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
