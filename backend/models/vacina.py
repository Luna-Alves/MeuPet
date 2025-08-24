from helpers.database import db

class Vacina(db.Model):
    __tablename__ = "vacina"
    id              = db.Column(db.Integer, primary_key=True)
    pet_id          = db.Column(db.Integer, db.ForeignKey('pet.id'), nullable=False)
    pet             = db.relationship('Pet', backref=db.backref('vacinas', cascade='all, delete-orphan'))

    nome            = db.Column(db.String(120), nullable=False)
    fabricante      = db.Column(db.String(120), nullable=False)
    data_aplicacao  = db.Column(db.Date, nullable=False)
    data_fabricacao = db.Column(db.Date, nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    data_revac      = db.Column(db.Date, nullable=False)
    lote            = db.Column(db.String(50), nullable=False)
    dose_tamanho    = db.Column(db.String(50), nullable=False)
    observacoes     = db.Column(db.Text)
