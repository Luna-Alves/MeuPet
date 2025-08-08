from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
import logging
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///meupet.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Habilita CORS para requisições cruzadas
CORS(app)

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('meupet')

# ORM com SQLAlchemy
db = SQLAlchemy(app)

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    data = db.Column(db.Date, nullable=False)
    rua = db.Column(db.String(200), nullable=False)
    bairro = db.Column(db.String(100), nullable=False)
    numero = db.Column(db.String(20), nullable=False)
    cep = db.Column(db.String(20), nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(2), nullable=False)
    complemento = db.Column(db.String(200))
    funcao = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(128), nullable=False)

# Schema com Marshmallow
class UsuarioSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Usuario
        load_instance = True

usuario_schema = UsuarioSchema()
usuarios_schema = UsuarioSchema(many=True)

# Endpoints CRUD
@app.route('/api/usuario', methods=['GET'])
def list_usuarios():
    usuarios = Usuario.query.all()
    return jsonify(usuarios_schema.dump(usuarios))


@app.route('/api/usuario/<int:id>', methods=['GET'])
def get_usuario(id):
    usuario = Usuario.query.get_or_404(id)
    return jsonify(usuario_schema.dump(usuario))

@app.route('/api/usuario', methods=['POST'])
def create_usuario():
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"errors": {"body": ["JSON inválido"]}}), 400

    try:
        usuario = usuario_schema.load(payload, session=db.session)
        db.session.add(usuario)
        db.session.commit()
        return jsonify(usuario_schema.dump(usuario)), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"errors": {"email": ["Já cadastrado."]}}), 409
    except Exception:
        db.session.rollback()
        app.logger.exception("Erro inesperado no create_usuario")
        return jsonify({"errors": {"_": ["Erro interno"]}}), 500

@app.route('/api/usuario/<int:id>', methods=['PUT'])
def update_usuario(id):
    usuario = Usuario.query.get_or_404(id)
    data = request.json
    usuario = usuario_schema.load(data, instance=usuario, session=db.session)
    db.session.commit()
    return jsonify(usuario_schema.dump(usuario))

@app.route('/api/usuario/<int:id>', methods=['DELETE'])
def delete_usuario(id):
    usuario = Usuario.query.get_or_404(id)
    db.session.delete(usuario)
    db.session.commit()
    return '', 204

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    app.logger.exception("500 não tratado")
    return jsonify({"error": "Internal error"}), 500

if __name__ == '__main__':
    # Cria as tabelas dentro do contexto da aplicação
    with app.app_context():
        db.create_all()
    # Inicia o servidor Flask
    app.run(debug=True, port=5500)