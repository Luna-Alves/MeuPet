from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, validates, ValidationError, pre_load, post_load, validates_schema
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import logging, jwt, re
import dns.resolver, dns.exception
from functools import wraps
from datetime import date
from sqlalchemy import func


logger = logging.getLogger("meupet")

ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$')
PET_ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$')

_resolver = dns.resolver.Resolver(configure=True)
_resolver.timeout = _resolver.lifetime = 2.0

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///meupet.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET'] = '123456789'

CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('meupet')

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
    senha = db.Column(db.String(255), nullable=False)

class Pet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    usuario = db.relationship('Usuario', backref=db.backref('pets', lazy=True))

    nome = db.Column(db.String(120), nullable=False)
    data_ref = db.Column(db.Date, nullable=False)
    especie = db.Column(db.String(50), nullable=False)
    porte = db.Column(db.String(20), nullable=False)
    peso = db.Column(db.Float, nullable=False)
    raca = db.Column(db.String(100), nullable=False)
    cor_pelagem = db.Column(db.String(100), nullable=False)

    idade_aproximada = db.Column(db.String(50))
    outras_caracteristicas = db.Column(db.Text)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

def _is_hash(s: str) -> bool:
    return isinstance(s, str) and (s.startswith("scrypt$") or s.startswith("pbkdf2:"))

class UsuarioSchema(SQLAlchemyAutoSchema):
    senha = fields.String(load_only=True, required=True)

    class Meta:
        model = Usuario
        load_instance = True

    @pre_load
    def normalize_input(self, data, **kwargs):
        if isinstance(data, dict):
            if 'email' in data and data['email']:
                data['email'] = data['email'].strip().lower()
            if 'estado' in data and data['estado']:
                data['estado'] = data['estado'].strip().upper()
            if 'funcao' in data and data['funcao']:
                data['funcao'] = data['funcao'].strip().lower()
        return data

    @post_load
    def finalize_hash(self, data, **kwargs):
        if isinstance(data, dict):
            s = data.get('senha')
            if s and not _is_hash(s):
                data['senha'] = generate_password_hash(s)
            return data
        else:
            if getattr(data, 'senha', None) and not _is_hash(data.senha):
                data.senha = generate_password_hash(data.senha)
            return data

    @validates('nome')
    def val_nome(self, v, **kwargs):
        if not ONLY_LETTERS.match((v or '').strip()):
            raise ValidationError('Use apenas letras e espaços.')

    @validates('rua')
    def val_rua(self, v, **kwargs):
        if not ONLY_LETTERS.match((v or '').strip()):
            raise ValidationError('Use apenas letras e espaços.')

    @validates('bairro')
    def val_bairro(self, v, **kwargs):
        if not ONLY_LETTERS.match((v or '').strip()):
            raise ValidationError('Use apenas letras e espaços.')

    @validates('cidade')
    def val_cidade(self, v, **kwargs):
        if not ONLY_LETTERS.match((v or '').strip()):
            raise ValidationError('Use apenas letras e espaços.')

    @validates('estado')
    def val_estado(self, v, **kwargs):
        if not re.fullmatch(r'[A-Za-z]{2}', (v or '').strip()):
            raise ValidationError('Use a sigla de 2 letras (ex.: SP).')

    @validates('cep')
    def val_cep(self, v, **kwargs):
        if not re.match(r'^\d{5}-?\d{3}$', (v or '')):
            raise ValidationError('CEP inválido (use 00000-000).')

    @validates('numero')
    def val_numero(self, v, **kwargs):
        if not re.match(r'^\d+$', (v or '')):
            raise ValidationError('Número deve conter apenas dígitos.')

    @validates('funcao')
    def val_funcao(self, v, **kwargs):
        if not v or v.lower() not in ('tutor', 'ong'):
            raise ValidationError('Função deve ser Tutor ou ONG.')

    @validates('email')
    def val_email(self, v, **kwargs):
        if not v or '@' not in v:
            raise ValidationError('Email inválido.')
        domain = v.split('@', 1)[1].strip().lower()
        if not has_mx(domain):
            raise ValidationError('O domínio do e-mail não existe ou não recebe e-mails (sem registro MX).')
        
usuario_schema = UsuarioSchema()
usuarios_schema = UsuarioSchema(many=True)

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
            try:
                if float(raw) <= 0:
                    raise ValidationError({'peso': ['Deve ser maior que zero.']})
                if isinstance(raw, int) or (isinstance(raw, float) and float(raw).is_integer()):
                    raise ValidationError({'peso': ['Informe com casas decimais, ex.: 7.5']})
            except Exception:
                raise ValidationError({'peso': ['Número inválido.']})
        else:
            s = str(raw).replace(',', '.').strip()
            if not re.fullmatch(r'\d+\.\d+', s):
                raise ValidationError({'peso': ['Informe com casas decimais, ex.: 7.5']})
            try:
                if float(s) <= 0:
                    raise ValidationError({'peso': ['Deve ser maior que zero.']})
            except Exception:
                raise ValidationError({'peso': ['Número inválido.']})

    @validates('nome')
    def v_nome(self, v, **kwargs):
        if not (v or '').strip():
            raise ValidationError('Obrigatório.')

    @validates('data')
    def v_data(self, v, **kwargs):
        if v > date.today():
            raise ValidationError('Não pode ser no futuro.')

    @validates('especie')
    def v_especie(self, v, **kwargs):
        if not (v or '').strip():
            raise ValidationError('Obrigatório.')

    @validates('porte')
    def v_porte(self, v, **kwargs):
        if not (v or '').strip():
            raise ValidationError('Obrigatório.')

    @validates('peso')
    def v_peso(self, v, **kwargs):
        try:
            if float(v) <= 0:
                raise ValidationError('Deve ser maior que zero.')
        except Exception:
            raise ValidationError('Número inválido.')

    @validates('raca')
    def v_raca(self, v, **kwargs):
        if not (v or '').strip():
            raise ValidationError('Obrigatório.')

    @validates('cor_pelagem')
    def v_cor(self, v, **kwargs):
        s = (v or '').strip()
        if not s:
            raise ValidationError('Obrigatório.')
        if not PET_ONLY_LETTERS.fullmatch(s):
            raise ValidationError('Use apenas letras (sem números).')

    @validates('idade_aproximada')
    def v_idade_apx(self, v, **kwargs):
        if v in (None, ''):
            return
        if not re.fullmatch(r'\d+', str(v)):
            raise ValidationError('Apenas números inteiros.')

pet_schema = PetSchema()
pets_schema = PetSchema(many=True)

def get_current_user_id():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
        return int(payload['sub'])
    except Exception:
        return None

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        uid = get_current_user_id()
        if not uid:
            return jsonify({"errors": {"_": ["Não autorizado."]}}), 401
        return fn(uid, *args, **kwargs)
    return wrapper

def gerar_token(usuario):
    payload = {
        "sub": usuario.id,
        "email": usuario.email,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    token = jwt.encode(payload, app.config['JWT_SECRET'], algorithm='HS256')
    return token

def has_mx(domain: str) -> bool:
    """Retorna False para qualquer falha/timeout; nunca levanta exceção."""
    try:
        ans = _resolver.resolve(domain, 'MX')
        return len(ans) > 0
    except (dns.exception.DNSException, OSError) as e:
        logger.warning("Falha ao checar MX de %s: %s", domain, e)
        return False


@app.route('/api/usuario', methods=['POST'])
def create_usuario():
    try:
        payload = request.get_json(force=True)
        usuario = usuario_schema.load(payload, session=db.session)
        db.session.add(usuario)
        db.session.commit()
        token = gerar_token(usuario)
        return jsonify({**usuario_schema.dump(usuario), "token": token}), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"errors": {"email": ["Já cadastrado."]}}), 409
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro inesperado no create_usuario: %s", e)
        return jsonify({"errors": {"_": ["Erro interno"]}}), 500
    
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"errors": {"_": ["Email e senha são obrigatórios."]}}), 400
    if '@' not in email:
        return jsonify({"errors": {"email": ["Email inválido."]}}), 400

    domain = email.split('@', 1)[1]
    if not has_mx(domain):
        return jsonify({"errors": {"email": ["O domínio do e-mail não existe ou não recebe e-mails (sem MX)."]}}), 400

    u = Usuario.query.filter_by(email=email).first()

    if not u:
        return jsonify({"errors": {"email": ["Usuário não existente."]}}), 404

    if not check_password_hash(u.senha, senha):
        return jsonify({"errors": {"senha": ["Senha incorreta."]}}), 401

    token = gerar_token(u)
    return jsonify({"token": token, "id": u.id, "nome": u.nome, "email": u.email}), 200

@app.route('/api/usuario', methods=['GET'])
def list_usuarios():
    usuarios = Usuario.query.all()
    return jsonify(usuarios_schema.dump(usuarios)), 200

@app.route('/api/usuario/<int:id>', methods=['GET'])
def get_usuario(id):
    usuario = Usuario.query.get_or_404(id)
    return jsonify(usuario_schema.dump(usuario)), 200

@app.route('/api/me', methods=['GET'])
def me():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({"error": "Sem token"}), 401
    token = auth.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
    except Exception:
        return jsonify({"error": "Token inválido/expirado"}), 401
    usuario = Usuario.query.get(payload['sub'])
    if not usuario:
        return jsonify({"error": "Usuário não existe"}), 404
    return jsonify(usuario_schema.dump(usuario)), 200

@app.route('/api/pets', methods=['POST'])
@login_required
def create_pet(current_user_id):
    try:
        payload = request.get_json(force=True)
        pet = pet_schema.load(payload, session=db.session)

        nome = (pet.nome or "").strip()
        exists = Pet.query.filter(
            Pet.usuario_id == current_user_id,
            func.lower(Pet.nome) == func.lower(nome)
        ).first()
        if exists:
            return jsonify({"errors": {"nome": ["Você já possui um pet com esse nome."]}}), 409

        pet.usuario_id = current_user_id
        db.session.add(pet)
        db.session.commit()
        return jsonify(pet_schema.dump(pet)), 201

    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"errors": {"nome": ["Você já possui um pet com esse nome."]}}), 409
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro inesperado no create_pet: %s", e)
        return jsonify({"errors": {"_": ["Erro interno"]}}), 500
    
@app.route('/api/pets', methods=['GET'])
@login_required
def list_pets(current_user_id):
    pets = (
        Pet.query
        .filter_by(usuario_id=current_user_id)
        .order_by(func.lower(Pet.nome))
        .all()
    )
    return jsonify(pets_schema.dump(pets)), 200

@app.route('/api/pets/<int:pet_id>', methods=['GET'])
@login_required
def get_pet(current_user_id, pet_id):
    pet = Pet.query.filter_by(id=pet_id, usuario_id=current_user_id).first_or_404()
    return jsonify(pet_schema.dump(pet)), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(ValidationError)
def handle_mm_error(err):
    return jsonify({"errors": err.messages}), 400

@app.errorhandler(500)
def server_error(e):
    app.logger.exception("500 não tratado")
    return jsonify({"error": "Internal error"}), 500

def _parece_hash(s: str) -> bool:
    return isinstance(s, str) and (s.startswith("scrypt$") or s.startswith("pbkdf2:"))

@app.cli.command("rehash-passwords")
def rehash_passwords():
    with app.app_context():
        alteradas = 0
        for u in Usuario.query.all():
            if not _parece_hash(u.senha):
                u.senha = generate_password_hash(u.senha)
                alteradas += 1
        db.session.commit()
        print(f"Senhas re-hashadas: {alteradas}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5500)
