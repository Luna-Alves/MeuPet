import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOGGER_NAME = "meupet"
logger = logging.getLogger(LOGGER_NAME)
logger.setLevel(logging.INFO)

if not logger.handlers:
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    ))
    logger.addHandler(console)

    # logs em instance/logs/app.log (na raiz do projeto)
    base_dir = Path(__file__).resolve().parents[2]  # .../backend/helpers/logging -> sobe 2
    instance_dir = Path(os.environ.get("INSTANCE_DIR", base_dir.parent / "instance"))
    logs_dir = instance_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    file_handler = RotatingFileHandler(
        logs_dir / "app.log", maxBytes=2_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(filename)s:%(lineno)d | %(message)s"
    ))
    logger.addHandler(file_handler)

def get_logger() -> logging.Logger:
    return logger
