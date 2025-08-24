from datetime import datetime
from helpers.database import db

class Pet(db.Model):
    __tablename__ = "pet"
    id          = db.Column(db.Integer, primary_key=True)
    usuario_id  = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    usuario     = db.relationship('Usuario', backref=db.backref('pets', lazy=True))

    nome        = db.Column(db.String(120), nullable=False)
    data_ref    = db.Column(db.Date, nullable=False)
    especie     = db.Column(db.String(50), nullable=False)
    porte       = db.Column(db.String(20), nullable=False)
    peso        = db.Column(db.Float, nullable=False)
    raca        = db.Column(db.String(100), nullable=False)
    cor_pelagem = db.Column(db.String(100), nullable=False)

    idade_aproximada     = db.Column(db.String(50))
    outras_caracteristicas= db.Column(db.Text)
    criado_em            = db.Column(db.DateTime, default=datetime.utcnow)
