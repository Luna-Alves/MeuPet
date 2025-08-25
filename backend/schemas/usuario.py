import os, re, dns.resolver, dns.exception
from werkzeug.security import generate_password_hash
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, validates, ValidationError, pre_load, post_load
from models.usuario import Usuario
from datetime import date


ONLY_LETTERS = re.compile(r'^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$')
_resolver = dns.resolver.Resolver(configure=True)
_resolver.timeout = _resolver.lifetime = 2.0

def has_mx(domain: str) -> bool:
    try:
        ans = _resolver.resolve(domain, 'MX')
        return len(ans) > 0
    except (dns.exception.DNSException, OSError):
        return False

def _is_hash(s: str) -> bool:
    return isinstance(s, str) and (s.startswith("pbkdf2:") or s.startswith("scrypt:"))

HASH_METHOD = os.environ.get("HASH_METHOD", "pbkdf2:sha256")  # padroniza

class UsuarioSchema(SQLAlchemyAutoSchema):
    # senha agora é opcional neste schema base (útil para updates)
    senha = fields.String(load_only=True)

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
    def only_hash_when_present(self, data, **kwargs):
        """
        Regra:
        - Só toca em 'senha' se a chave/campo existir no payload.
        - Se existir e não estiver hasheada => hashear.
        - Suporta tanto dict quanto instância (load_instance=True).
        """
        if isinstance(data, dict):
            if 'senha' in data:
                s = data['senha']
                if s and not _is_hash(s):
                    data['senha'] = generate_password_hash(s, method=HASH_METHOD, salt_length=16)
            return data

        # data é uma instância de Usuario
        if hasattr(data, 'senha') and data.senha and not _is_hash(data.senha):
            data.senha = generate_password_hash(data.senha, method=HASH_METHOD, salt_length=16)
        return data

    @validates('nome')
    def val_nome(self, v, **kwargs):
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
    
    @validates('data')
    def val_data_nascimento(self, v: date, **kwargs):
        hoje = date.today()
        anos = hoje.year - v.year - ((hoje.month, hoje.day) < (v.month, v.day))
        if anos < 18:
            raise ValidationError('Você precisa ter 18 anos ou mais para se cadastrar.')

# Schema específico para criação: senha obrigatória
class UsuarioCreateSchema(UsuarioSchema):
    senha = fields.String(load_only=True, required=True)
