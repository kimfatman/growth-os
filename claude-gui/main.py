#!/usr/bin/env python3
"""Claude GUI — PySide6 Desktop Client for Claude Code."""

# ═══════════════════════════════════════════════════════════════
# Imports
# ═══════════════════════════════════════════════════════════════
import json
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from pathlib import Path
from typing import Optional

from PySide6.QtCore import (
    QObject,
    QProcess,
    QSettings,
    QThread,
    Qt,
    QTimer,
    Signal,
    Slot,
)
from PySide6.QtGui import QAction, QFont, QKeySequence, QTextCursor
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenuBar,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QSpinBox,
    QStatusBar,
    QTabWidget,
    QTextBrowser,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)


# ═══════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════
APP_NAME = "Claude GUI"
APP_VERSION = "1.0.0"
APP_ORG = "ClaudeGUI"
CONFIG_DIR = Path(os.environ.get("APPDATA", Path.home() / ".config")) / "ClaudeGUI"
CONFIG_FILE = CONFIG_DIR / "config.json"
DEFAULT_MODEL = "deepseek-chat"
DEFAULT_MAX_TOKENS = 4096
DEFAULT_BASE_URL = "https://api.anthropic.com"

MODELS = [
    "deepseek-chat",
    "deepseek-reasoner",
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-haiku-4-5",
]

# ═══════════════════════════════════════════════════════════════
# Dark Theme QSS
# ═══════════════════════════════════════════════════════════════
DARK_QSS = """
QMainWindow { background: #0d1117; }
QWidget { background: #0d1117; color: #c9d1d9; font-family: "Segoe UI"; font-size: 9pt; }

QMenuBar { background: #161b22; border-bottom: 1px solid #30363d; padding: 2px; }
QMenuBar::item { padding: 4px 12px; background: transparent; border-radius: 4px; }
QMenuBar::item:selected { background: #21262d; }
QMenu { background: #161b22; border: 1px solid #30363d; padding: 4px; }
QMenu::item { padding: 6px 24px; border-radius: 4px; }
QMenu::item:selected { background: #21262d; }
QMenu::separator { height: 1px; background: #30363d; margin: 4px 8px; }

QTabWidget::pane { background: #0d1117; border: 1px solid #30363d; }
QTabBar::tab { background: #161b22; color: #8b949e; padding: 8px 20px; border: 1px solid #30363d;
    border-bottom: none; border-top-left-radius: 6px; border-top-right-radius: 6px; margin-right: 2px; }
QTabBar::tab:selected { background: #0d1117; color: #c9d1d9; border-bottom: 2px solid #d4a574; }
QTabBar::tab:hover:!selected { background: #21262d; color: #c9d1d9; }

QTextBrowser { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px;
    selection-background-color: #264f78; }
QTextEdit, QPlainTextEdit { background: #21262d; border: 1px solid #30363d; border-radius: 6px;
    padding: 8px; selection-background-color: #264f78; }
QTextEdit:focus, QPlainTextEdit:focus, QLineEdit:focus { border-color: #d4a574; }
QLineEdit { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 6px 10px; }

QPushButton { background: #d4a574; color: #0d1117; border: none; border-radius: 4px;
    padding: 6px 16px; font-weight: bold; }
QPushButton:hover { background: #e3b98a; }
QPushButton:pressed { background: #c5945e; }
QPushButton:disabled { background: #30363d; color: #484f58; }

QComboBox { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 4px 8px; }
QComboBox:focus { border-color: #d4a574; }
QComboBox QAbstractItemView { background: #161b22; border: 1px solid #30363d; selection-background-color: #21262d; }
QComboBox::drop-down { border: none; width: 20px; }

QSpinBox { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 4px; }
QSpinBox:focus { border-color: #d4a574; }

QCheckBox { spacing: 8px; }
QCheckBox::indicator { width: 16px; height: 16px; border: 1px solid #30363d; border-radius: 3px;
    background: #21262d; }
QCheckBox::indicator:checked { background: #d4a574; border-color: #d4a574; }

QScrollBar:vertical { background: #0d1117; width: 8px; border-radius: 4px; }
QScrollBar::handle:vertical { background: #484f58; border-radius: 4px; min-height: 30px; }
QScrollBar::handle:vertical:hover { background: #6e7681; }
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }

QStatusBar { background: #161b22; border-top: 1px solid #30363d; color: #8b949e; }

QLabel { background: transparent; }

QDialog { background: #161b22; }
QFormLayout { background: transparent; }
"""

# ═══════════════════════════════════════════════════════════════
# Message Bubble CSS (injected into QTextBrowser HTML)
# ═══════════════════════════════════════════════════════════════
BUBBLE_CSS = """
body { font-family: 'Segoe UI', sans-serif; color: #c9d1d9; margin: 0; padding: 0; background: #0d1117; }
.user-msg { background: #1a3a5c; border-radius: 8px; padding: 10px 14px; margin: 6px 40px 6px 0; }
.asst-msg { background: #21262d; border-radius: 8px; padding: 10px 14px; margin: 6px 0 6px 0; }
.think-block { border-left: 3px solid #d4a574; padding: 6px 14px; margin: 6px 0; color: #8b949e; font-style: italic; }
.sys-msg { color: #8b949e; font-style: italic; text-align: center; margin: 8px 0; }
.msg-header { color: #8b949e; font-size: 8pt; margin-bottom: 4px; }
pre { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; overflow-x: auto; }
code { font-family: 'Consolas', 'Cascadia Code', monospace; font-size: 9pt; }
.codehilite { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; overflow-x: auto; }
.codehilite pre { background: transparent; border: none; padding: 0; margin: 0; }
.err-msg { background: #490202; border-radius: 8px; padding: 10px 14px; margin: 6px 0; color: #f85149; }
.status-line { color: #8b949e; font-size: 8pt; text-align: center; margin: 4px 0; }
"""

# ═══════════════════════════════════════════════════════════════
# Data Classes
# ═══════════════════════════════════════════════════════════════
@dataclass
class ChatMessage:
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: str = field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))
    tokens: int = 0
    thinking: str = ""


class LogLevel(Enum):
    DEBUG = auto()
    INFO = auto()
    WARNING = auto()
    ERROR = auto()


# ═══════════════════════════════════════════════════════════════
# Config Manager
# ═══════════════════════════════════════════════════════════════
class ConfigManager:
    @staticmethod
    def load() -> dict:
        if CONFIG_FILE.exists():
            try:
                return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                return {}
        return {}

    @staticmethod
    def save(data: dict) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    @staticmethod
    def get_api_key() -> str:
        return os.environ.get("ANTHROPIC_API_KEY", ConfigManager.load().get("api_key", ""))

    @staticmethod
    def get_base_url() -> str:
        return os.environ.get("ANTHROPIC_BASE_URL", ConfigManager.load().get("base_url", DEFAULT_BASE_URL))

    @staticmethod
    def get_model() -> str:
        return ConfigManager.load().get("model", DEFAULT_MODEL)

    @staticmethod
    def get_max_tokens() -> int:
        return ConfigManager.load().get("max_tokens", DEFAULT_MAX_TOKENS)

    @staticmethod
    def get_system_prompt() -> str:
        return ConfigManager.load().get("system_prompt", "")


# ═══════════════════════════════════════════════════════════════
# Log Emitter (cross-thread singleton)
# ═══════════════════════════════════════════════════════════════
class LogEmitter(QObject):
    _instance: Optional["LogEmitter"] = None

    log_signal = Signal(str, str, str)  # timestamp, level, message

    def __init__(self):
        super().__init__()
        LogEmitter._instance = self

    @classmethod
    def instance(cls) -> "LogEmitter":
        if cls._instance is None:
            cls._instance = LogEmitter()
        return cls._instance

    @classmethod
    def debug(cls, msg: str) -> None:
        cls._emit("DEBUG", msg)

    @classmethod
    def info(cls, msg: str) -> None:
        cls._emit("INFO", msg)

    @classmethod
    def warning(cls, msg: str) -> None:
        cls._emit("WARN", msg)

    @classmethod
    def error(cls, msg: str) -> None:
        cls._emit("ERROR", msg)

    @classmethod
    def _emit(cls, level: str, msg: str) -> None:
        ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        emitter = cls.instance()
        emitter.log_signal.emit(ts, level, msg)


# ═══════════════════════════════════════════════════════════════
# Claude Worker (runs in QThread)
# ═══════════════════════════════════════════════════════════════
class ClaudeWorker(QObject):
    chunk_ready = Signal(str)
    thinking_chunk = Signal(str)
    stream_finished = Signal(str, dict)  # full_text, usage dict
    stream_error = Signal(str)

    def __init__(self):
        super().__init__()
        self._stop_flag = False
        self._api_key = ""
        self._base_url = DEFAULT_BASE_URL
        self._model = DEFAULT_MODEL
        self._max_tokens = DEFAULT_MAX_TOKENS

    def configure(self, api_key: str, model: str, max_tokens: int, base_url: str = "") -> None:
        self._api_key = api_key
        self._model = model
        self._max_tokens = max_tokens
        if base_url:
            self._base_url = base_url

    @Slot(list, str)
    def run(self, messages: list, system_prompt: str = "") -> None:
        try:
            import anthropic
        except ImportError:
            self.stream_error.emit("请先安装 anthropic SDK: pip install anthropic")
            return

        if not self._api_key:
            self.stream_error.emit("未设置 API Key，请在设置中配置")
            return

        client = anthropic.Anthropic(api_key=self._api_key, base_url=self._base_url)
        full_text = ""
        thinking_text = ""
        self._stop_flag = False

        try:
            kwargs = {
                "model": self._model,
                "max_tokens": self._max_tokens,
                "messages": messages,
            }
            if system_prompt:
                kwargs["system"] = system_prompt

            with client.messages.stream(**kwargs) as stream:
                for event in stream:
                    if self._stop_flag:
                        break
                    if event.type == "content_block_delta":
                        if event.delta.type == "text_delta":
                            full_text += event.delta.text
                            self.chunk_ready.emit(event.delta.text)
                        elif event.delta.type == "thinking_delta":
                            thinking_text += event.delta.thinking
                            self.thinking_chunk.emit(event.delta.thinking)

            usage = {}
            try:
                final = stream.get_final_message()
                usage = {
                    "input_tokens": final.usage.input_tokens,
                    "output_tokens": final.usage.output_tokens,
                }
            except Exception:
                pass

            self.stream_finished.emit(full_text, usage)
        except anthropic.AuthenticationError:
            self.stream_error.emit("API Key 无效，请检查设置")
        except anthropic.RateLimitError:
            self.stream_error.emit("API 频率限制，请稍后重试")
        except Exception as e:
            self.stream_error.emit(f"请求失败: {str(e)}")

    def stop(self) -> None:
        self._stop_flag = True


# ═══════════════════════════════════════════════════════════════
# Settings Dialog
# ═══════════════════════════════════════════════════════════════
class SettingsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("设置")
        self.setMinimumWidth(420)
        self.setStyleSheet(DARK_QSS)
        self._build_ui()
        self._load()

    def _build_ui(self):
        layout = QVBoxLayout(self)

        form = QFormLayout()
        form.setSpacing(10)

        self.api_key_input = QLineEdit()
        self.api_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.api_key_input.setPlaceholderText("sk-ant-... or sk-...")
        form.addRow("API Key:", self.api_key_input)

        self.base_url_input = QLineEdit()
        self.base_url_input.setPlaceholderText("https://api.anthropic.com")
        form.addRow("Base URL:", self.base_url_input)

        self.model_combo = QComboBox()
        self.model_combo.setEditable(True)
        self.model_combo.addItems(MODELS)
        form.addRow("Model:", self.model_combo)

        self.max_tokens_spin = QSpinBox()
        self.max_tokens_spin.setRange(256, 32768)
        self.max_tokens_spin.setSingleStep(256)
        self.max_tokens_spin.setValue(DEFAULT_MAX_TOKENS)
        form.addRow("Max Tokens:", self.max_tokens_spin)

        self.system_prompt_input = QPlainTextEdit()
        self.system_prompt_input.setPlaceholderText("可选：自定义系统提示词")
        self.system_prompt_input.setMaximumHeight(100)
        form.addRow("System Prompt:", self.system_prompt_input)

        layout.addLayout(form)

        hint = QLabel("提示：也可通过环境变量 ANTHROPIC_API_KEY 设置密钥")
        hint.setStyleSheet("color: #8b949e; font-size: 8pt;")
        layout.addWidget(hint)

        layout.addSpacing(10)

        buttons = QDialogButtonBox()
        buttons.setStandardButtons(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self._save_and_accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _load(self):
        cfg = ConfigManager.load()
        saved_key = cfg.get("api_key", "")
        if saved_key:
            self.api_key_input.setText(saved_key)
        saved_base = cfg.get("base_url", DEFAULT_BASE_URL)
        self.base_url_input.setText(saved_base)
        model = cfg.get("model", DEFAULT_MODEL)
        idx = self.model_combo.findText(model)
        if idx >= 0:
            self.model_combo.setCurrentIndex(idx)
        else:
            self.model_combo.setCurrentText(model)
        self.max_tokens_spin.setValue(cfg.get("max_tokens", DEFAULT_MAX_TOKENS))
        self.system_prompt_input.setPlainText(cfg.get("system_prompt", ""))

    def _save_and_accept(self):
        cfg = ConfigManager.load()
        cfg["api_key"] = self.api_key_input.text().strip()
        base = self.base_url_input.text().strip()
        if base:
            cfg["base_url"] = base
        cfg["model"] = self.model_combo.currentText().strip()
        cfg["max_tokens"] = self.max_tokens_spin.value()
        cfg["system_prompt"] = self.system_prompt_input.toPlainText().strip()
        ConfigManager.save(cfg)
        LogEmitter.info(f"设置已保存 (model={cfg['model']}, base_url={cfg.get('base_url', 'default')})")
        self.accept()


# ═══════════════════════════════════════════════════════════════
# Chat Tab
# ═══════════════════════════════════════════════════════════════
class ChatTab(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.messages: list[ChatMessage] = []
        self.stream_buffer = ""
        self.stream_thinking = ""
        self.stream_dirty = False
        self.worker: Optional[ClaudeWorker] = None
        self.thread: Optional[QThread] = None
        self._sending = False

        self._build_ui()
        self._setup_debounce()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)

        # Toolbar
        toolbar = QHBoxLayout()

        self.model_label = QLabel(ConfigManager.get_model())
        self.model_label.setStyleSheet("color: #d4a574; font-weight: bold;")
        toolbar.addWidget(self.model_label)

        toolbar.addStretch()

        self.token_label = QLabel("")
        self.token_label.setStyleSheet("color: #8b949e; font-size: 8pt;")
        toolbar.addWidget(self.token_label)

        clear_btn = QPushButton("清除对话")
        clear_btn.setFixedWidth(80)
        clear_btn.clicked.connect(self.clear_chat)
        toolbar.addWidget(clear_btn)

        layout.addLayout(toolbar)

        # Message display
        self.display = QTextBrowser()
        self.display.setReadOnly(True)
        self.display.setOpenExternalLinks(True)
        self.display.setHtml(self._build_html())
        layout.addWidget(self.display, stretch=1)

        # Input area
        input_layout = QHBoxLayout()
        input_layout.setSpacing(8)

        self.input_box = QTextEdit()
        self.input_box.setPlaceholderText("输入消息... (Ctrl+Enter 发送)")
        self.input_box.setMaximumHeight(120)
        self.input_box.setMinimumHeight(50)
        self.input_box.installEventFilter(self)
        input_layout.addWidget(self.input_box)

        btn_layout = QVBoxLayout()
        btn_layout.setSpacing(4)

        self.send_btn = QPushButton("发送")
        self.send_btn.setFixedWidth(70)
        self.send_btn.clicked.connect(self.send_message)
        btn_layout.addWidget(self.send_btn)

        self.stop_btn = QPushButton("停止")
        self.stop_btn.setFixedWidth(70)
        self.stop_btn.setEnabled(False)
        self.stop_btn.setStyleSheet(
            "QPushButton { background: #f85149; color: #fff; }"
            "QPushButton:hover { background: #ff6b63; }"
        )
        self.stop_btn.clicked.connect(self.stop_stream)
        btn_layout.addWidget(self.stop_btn)

        input_layout.addLayout(btn_layout)
        layout.addLayout(input_layout)

    def _setup_debounce(self):
        self.debounce_timer = QTimer()
        self.debounce_timer.setSingleShot(True)
        self.debounce_timer.setInterval(50)
        self.debounce_timer.timeout.connect(self._flush_stream)

    def eventFilter(self, obj, event):
        from PySide6.QtCore import QEvent

        if obj is self.input_box and event.type() == QEvent.Type.KeyPress:
            if (
                event.key() == Qt.Key.Key_Return
                and event.modifiers() == Qt.KeyboardModifier.ControlModifier
            ):
                self.send_message()
                return True
        return super().eventFilter(obj, event)

    def send_message(self):
        if self._sending:
            return

        text = self.input_box.toPlainText().strip()
        if not text:
            return

        api_key = ConfigManager.get_api_key()
        if not api_key:
            LogEmitter.warning("未设置 API Key，请先打开设置(File → Settings)")
            self._show_settings_hint()
            return

        self.input_box.clear()
        self._sending = True
        self.send_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)

        msg = ChatMessage(role="user", content=text)
        self.messages.append(msg)
        self.display.setHtml(self._build_html())
        self._scroll_bottom()

        LogEmitter.info(f"发送消息 ({len(text)} 字符)")

        # Prepare API messages
        api_messages = [
            {"role": m.role, "content": m.content}
            for m in self.messages
            if m.role in ("user", "assistant")
        ]

        # Create worker thread
        self.worker = ClaudeWorker()
        self.worker.configure(
            api_key=api_key,
            model=ConfigManager.get_model(),
            max_tokens=ConfigManager.get_max_tokens(),
            base_url=ConfigManager.get_base_url(),
        )
        self.thread = QThread()
        self.worker.moveToThread(self.thread)

        # Connect signals
        self.worker.chunk_ready.connect(self._on_chunk, Qt.ConnectionType.QueuedConnection)
        self.worker.thinking_chunk.connect(self._on_thinking, Qt.ConnectionType.QueuedConnection)
        self.worker.stream_finished.connect(self._on_complete, Qt.ConnectionType.QueuedConnection)
        self.worker.stream_error.connect(self._on_error, Qt.ConnectionType.QueuedConnection)
        self.thread.started.connect(
            lambda: self.worker.run(api_messages, ConfigManager.get_system_prompt())
        )
        self.worker.stream_finished.connect(self.thread.quit)
        self.worker.stream_error.connect(self.thread.quit)
        self.thread.finished.connect(self.thread.deleteLater)

        self.thread.start()
        LogEmitter.debug(f"QThread started, model={ConfigManager.get_model()}")

    def stop_stream(self):
        if self.worker:
            self.worker.stop()
            LogEmitter.info("用户停止流式传输")
        self._reset_sending_state()

    def _on_chunk(self, text: str):
        self.stream_buffer += text
        self.stream_dirty = True
        if not self.debounce_timer.isActive():
            self.debounce_timer.start()

    def _on_thinking(self, text: str):
        self.stream_thinking += text

    def _flush_stream(self):
        if not self.stream_dirty:
            return
        self.stream_dirty = False
        self.display.setHtml(self._build_html())
        self._scroll_bottom()

    def _on_complete(self, full_text: str, usage: dict):
        self.stream_buffer = ""
        thinking = self.stream_thinking
        self.stream_thinking = ""

        tokens = usage.get("output_tokens", 0)
        msg = ChatMessage(role="assistant", content=full_text, tokens=tokens, thinking=thinking)
        self.messages.append(msg)

        self.display.setHtml(self._build_html())
        self._scroll_bottom()

        input_t = usage.get("input_tokens", 0)
        output_t = usage.get("output_tokens", 0)
        self.token_label.setText(f"↑{input_t} ↓{output_t}")
        LogEmitter.info(f"流式传输完成 (input={input_t}, output={output_t} tokens)")

        self._reset_sending_state()

    def _on_error(self, error_msg: str):
        self.stream_buffer = ""
        self.stream_thinking = ""
        msg = ChatMessage(role="system", content=error_msg)
        self.messages.append(msg)
        self.display.setHtml(self._build_html())
        self._scroll_bottom()
        LogEmitter.error(error_msg)
        self._reset_sending_state()

    def _reset_sending_state(self):
        self._sending = False
        self.send_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.worker = None
        self.thread = None

    def clear_chat(self):
        self.messages.clear()
        self.stream_buffer = ""
        self.stream_thinking = ""
        self.stream_dirty = False
        self.display.setHtml(self._build_html())
        self.token_label.setText("")
        LogEmitter.info("对话已清除")

    def _show_settings_hint(self):
        reply = QMessageBox.question(
            self,
            "需要 API Key",
            "尚未配置 Anthropic API Key。\n\n是否现在打开设置？",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if reply == QMessageBox.StandardButton.Yes:
            dlg = SettingsDialog(self)
            if dlg.exec() == QDialog.DialogCode.Accepted:
                self.model_label.setText(ConfigManager.get_model())

    def _build_html(self) -> str:
        import markdown

        md = markdown.Markdown(extensions=["fenced_code", "codehilite", "tables", "nl2br"])

        parts = [
            "<html><head>",
            f"<style>{BUBBLE_CSS}</style>",
            "</head><body>",
        ]

        for msg in self.messages:
            role_class = {
                "user": "user-msg",
                "assistant": "asst-msg",
                "system": "sys-msg",
            }.get(msg.role, "sys-msg")

            header = f'<div class="msg-header">{msg.role.upper()} · {msg.timestamp}</div>'

            if msg.role == "system":
                parts.append(f'<div class="{role_class}">{msg.content}</div>')
            elif msg.role == "user":
                escaped = msg.content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                parts.append(f'<div class="{role_class}">{header}{escaped}</div>')
            else:
                rendered = md.convert(msg.content)
                parts.append(f'<div class="{role_class}">{header}{rendered}</div>')

            if msg.thinking:
                parts.append(
                    f'<div class="think-block"><b>Thinking:</b><br>{msg.thinking.replace(chr(60), "&lt;").replace(chr(62), "&gt;")}</div>'
                )

        # Streaming content
        if self.stream_buffer:
            rendered = md.convert(self.stream_buffer)
            parts.append(
                f'<div class="asst-msg"><div class="msg-header">ASSISTANT · streaming</div>{rendered}</div>'
            )

        if self.stream_thinking:
            parts.append(
                f'<div class="think-block"><b>Thinking:</b><br>{self.stream_thinking.replace(chr(60), "&lt;").replace(chr(62), "&gt;")}</div>'
            )

        parts.append("</body></html>")
        return "\n".join(parts)

    def _scroll_bottom(self):
        cursor = self.display.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.display.setTextCursor(cursor)


# ═══════════════════════════════════════════════════════════════
# Terminal Tab
# ═══════════════════════════════════════════════════════════════
class TerminalTab(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.process: Optional[QProcess] = None
        self.command_history: list[str] = []
        self.history_index = -1

        self._build_ui()
        self._setup_process()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)

        # Toolbar
        toolbar = QHBoxLayout()

        shell_label = QLabel("Shell:")
        toolbar.addWidget(shell_label)

        self.shell_combo = QComboBox()
        self.shell_combo.addItems(["cmd", "powershell", "bash"])
        self.shell_combo.setFixedWidth(120)
        toolbar.addWidget(self.shell_combo)

        cwd_label = QLabel(f"CWD: {os.getcwd()}")
        cwd_label.setStyleSheet("color: #8b949e;")
        toolbar.addWidget(cwd_label)

        toolbar.addStretch()

        clear_btn = QPushButton("清屏")
        clear_btn.setFixedWidth(60)
        clear_btn.clicked.connect(lambda: self.output_display.clear())
        toolbar.addWidget(clear_btn)

        layout.addLayout(toolbar)

        # Output display
        self.output_display = QTextBrowser()
        self.output_display.setReadOnly(True)
        mono = QFont("Consolas", 10)
        self.output_display.setFont(mono)
        self.output_display.setStyleSheet(
            "QTextBrowser { background: #0d1117; color: #c9d1d9; border: 1px solid #30363d; }"
        )
        layout.addWidget(self.output_display, stretch=1)

        # Command input
        cmd_layout = QHBoxLayout()
        cmd_layout.setSpacing(6)

        prompt = QLabel("$")
        prompt.setFont(mono)
        prompt.setStyleSheet("color: #3fb950; font-weight: bold;")
        cmd_layout.addWidget(prompt)

        self.cmd_input = QLineEdit()
        self.cmd_input.setFont(mono)
        self.cmd_input.setPlaceholderText("输入命令，按 Enter 执行")
        self.cmd_input.returnPressed.connect(self.run_command)
        cmd_layout.addWidget(self.cmd_input)

        layout.addLayout(cmd_layout)

    def _setup_process(self):
        self.process = QProcess()
        self.process.setProcessChannelMode(QProcess.ProcessChannelMode.SeparateChannels)
        self.process.readyReadStandardOutput.connect(self._on_stdout)
        self.process.readyReadStandardError.connect(self._on_stderr)
        self.process.finished.connect(self._on_finished)

    def run_command(self):
        cmd = self.cmd_input.text().strip()
        if not cmd:
            return

        self.command_history.append(cmd)
        self.history_index = len(self.command_history)
        self.cmd_input.clear()

        self.output_display.append(f'<span style="color:#3fb950">$</span> <b>{cmd}</b>')

        shell_map = {
            "cmd": ("cmd.exe", ["/c", cmd]),
            "powershell": ("powershell.exe", ["-NoProfile", "-Command", cmd]),
            "bash": ("bash.exe", ["-c", cmd]),
        }
        shell_name = self.shell_combo.currentText()
        program, args = shell_map.get(shell_name, shell_map["cmd"])

        self.cmd_input.setEnabled(False)
        LogEmitter.info(f"执行命令: {cmd}")
        self.process.start(program, args)

    def _on_stdout(self):
        data = self.process.readAllStandardOutput()
        text = bytes(data).decode("utf-8", errors="replace")
        self.output_display.insertPlainText(text)
        self._scroll_bottom()

    def _on_stderr(self):
        data = self.process.readAllStandardError()
        text = bytes(data).decode("utf-8", errors="replace")
        self.output_display.insertPlainText(text)
        self._scroll_bottom()

    def _on_finished(self, exit_code, exit_status):
        status = "OK" if exit_code == 0 else f"exit code {exit_code}"
        color = "#3fb950" if exit_code == 0 else "#f85149"
        self.output_display.append(
            f'<span style="color:{color}">[{status}]</span>\n'
        )
        self._scroll_bottom()
        self.cmd_input.setEnabled(True)
        self.cmd_input.setFocus()
        LogEmitter.debug(f"命令完成 ({status})")

    def _scroll_bottom(self):
        cursor = self.output_display.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.output_display.setTextCursor(cursor)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Up:
            if self.history_index > 0:
                self.history_index -= 1
                self.cmd_input.setText(self.command_history[self.history_index])
        elif event.key() == Qt.Key.Key_Down:
            if self.history_index < len(self.command_history) - 1:
                self.history_index += 1
                self.cmd_input.setText(self.command_history[self.history_index])
            else:
                self.history_index = len(self.command_history)
                self.cmd_input.clear()
        super().keyPressEvent(event)


# ═══════════════════════════════════════════════════════════════
# Log Tab
# ═══════════════════════════════════════════════════════════════
class LogTab(QWidget):
    MAX_LINES = 5000

    def __init__(self, parent=None):
        super().__init__(parent)
        self._build_ui()

        emitter = LogEmitter.instance()
        emitter.log_signal.connect(self.append_log, Qt.ConnectionType.QueuedConnection)

        LogEmitter.info("Claude GUI 启动完成")

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)

        # Toolbar
        toolbar = QHBoxLayout()

        self.auto_scroll_cb = QCheckBox("自动滚动")
        self.auto_scroll_cb.setChecked(True)
        toolbar.addWidget(self.auto_scroll_cb)

        toolbar.addStretch()

        # Log view (created first so button can reference it)
        self.log_view = QPlainTextEdit()
        self.log_view.setReadOnly(True)
        mono = QFont("Consolas", 9)
        self.log_view.setFont(mono)
        self.log_view.setMaximumBlockCount(self.MAX_LINES)
        self.log_view.setStyleSheet(
            "QPlainTextEdit { background: #0d1117; color: #c9d1d9; border: 1px solid #30363d; }"
        )

        clear_btn = QPushButton("清除")
        clear_btn.setFixedWidth(60)
        clear_btn.clicked.connect(self.log_view.clear)
        toolbar.addWidget(clear_btn)

        layout.addLayout(toolbar)
        layout.addWidget(self.log_view)

    @Slot(str, str, str)
    def append_log(self, timestamp: str, level: str, message: str):
        color = {
            "DEBUG": "#8b949e",
            "INFO": "#c9d1d9",
            "WARN": "#d29922",
            "ERROR": "#f85149",
        }.get(level, "#c9d1d9")

        line = f'<span style="color:#484f58">{timestamp}</span> <span style="color:{color}">[{level:5}]</span> {message}'
        self.log_view.appendHtml(line)

        if self.auto_scroll_cb.isChecked():
            cursor = self.log_view.textCursor()
            cursor.movePosition(QTextCursor.MoveOperation.End)
            self.log_view.setTextCursor(cursor)


# ═══════════════════════════════════════════════════════════════
# About Dialog
# ═══════════════════════════════════════════════════════════════
class AboutDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("关于")
        self.setFixedSize(320, 200)
        self.setStyleSheet(DARK_QSS)

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title = QLabel(f"{APP_NAME}")
        title.setStyleSheet("font-size: 16pt; font-weight: bold; color: #d4a574;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        version = QLabel(f"Version {APP_VERSION}")
        version.setStyleSheet("color: #8b949e;")
        version.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version)

        desc = QLabel("Claude Code 桌面图形客户端\n基于 PySide6 + Anthropic SDK")
        desc.setAlignment(Qt.AlignmentFlag.AlignCenter)
        desc.setStyleSheet("color: #c9d1d9;")
        layout.addWidget(desc)

        close_btn = QPushButton("关闭")
        close_btn.clicked.connect(self.accept)
        layout.addWidget(close_btn)


# ═══════════════════════════════════════════════════════════════
# Main Window
# ═══════════════════════════════════════════════════════════════
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{APP_NAME} v{APP_VERSION}")
        self.setMinimumSize(900, 650)
        self.resize(1100, 750)

        self._restore_geometry()
        self._build_menu()
        self._build_tabs()
        self._build_statusbar()

        self.setStyleSheet(DARK_QSS)
        LogEmitter.info(f"{APP_NAME} v{APP_VERSION} 初始化完成")

        # Check API key on startup
        QTimer.singleShot(300, self._check_first_run)

    def _build_menu(self):
        menubar = self.menuBar()

        file_menu = menubar.addMenu("文件(&F)")

        settings_action = QAction("设置(&S)...", self)
        settings_action.setShortcut(QKeySequence("Ctrl+,"))
        settings_action.triggered.connect(self._open_settings)
        file_menu.addAction(settings_action)

        file_menu.addSeparator()

        exit_action = QAction("退出(&X)", self)
        exit_action.setShortcut(QKeySequence("Alt+F4"))
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        help_menu = menubar.addMenu("帮助(&H)")

        about_action = QAction("关于(&A)...", self)
        about_action.triggered.connect(lambda: AboutDialog(self).exec())
        help_menu.addAction(about_action)

    def _build_tabs(self):
        self.tabs = QTabWidget()

        self.chat_tab = ChatTab()
        self.tabs.addTab(self.chat_tab, "聊天")

        self.terminal_tab = TerminalTab()
        self.tabs.addTab(self.terminal_tab, "终端")

        self.log_tab = LogTab()
        self.tabs.addTab(self.log_tab, "日志")

        self.tabs.setCurrentIndex(0)

        # Keyboard shortcuts for tab switching
        self.tabs.setTabToolTip(0, "Ctrl+1")
        self.tabs.setTabToolTip(1, "Ctrl+2")
        self.tabs.setTabToolTip(2, "Ctrl+3")

        self.setCentralWidget(self.tabs)

        # Shortcuts
        for i, key in enumerate([Qt.Key.Key_1, Qt.Key.Key_2, Qt.Key.Key_3]):
            action = QAction(self)
            action.setShortcut(QKeySequence(f"Ctrl+{i + 1}"))
            action.triggered.connect(lambda checked, idx=i: self.tabs.setCurrentIndex(idx))
            self.addAction(action)

    def _build_statusbar(self):
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)

        self.status_model = QLabel(f"Model: {ConfigManager.get_model()}")
        self.status_model.setStyleSheet("color: #d4a574; padding: 0 12px;")
        self.status_bar.addWidget(self.status_model)

        self.status_text = QLabel("就绪")
        self.status_text.setStyleSheet("color: #8b949e; padding: 0 12px;")
        self.status_bar.addWidget(self.status_text)

        self.status_bar.addPermanentWidget(QLabel(""))

    def _open_settings(self):
        old_model = ConfigManager.get_model()
        dlg = SettingsDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            new_model = ConfigManager.get_model()
            self.chat_tab.model_label.setText(new_model)
            self.status_model.setText(f"Model: {new_model}")
            LogEmitter.info("设置已更新")

    def _check_first_run(self):
        if not ConfigManager.get_api_key():
            LogEmitter.warning("首次运行：未检测到 API Key")
            reply = QMessageBox.question(
                self,
                "欢迎使用 Claude GUI",
                "欢迎使用 Claude GUI！\n\n"
                "看起来您是第一次运行，需要先配置 Anthropic API Key。\n\n"
                "是否现在设置？",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            )
            if reply == QMessageBox.StandardButton.Yes:
                self._open_settings()

    def _restore_geometry(self):
        cfg = ConfigManager.load()
        geo = cfg.get("window_geometry")
        if geo:
            try:
                self.restoreGeometry(bytes.fromhex(geo))
                return
            except Exception:
                pass
        # Default: center on screen
        screen = QApplication.primaryScreen()
        if screen:
            center = screen.availableGeometry().center()
            frame = self.frameGeometry()
            frame.moveCenter(center)
            self.move(frame.topLeft())

    def _save_geometry(self):
        cfg = ConfigManager.load()
        cfg["window_geometry"] = self.saveGeometry().toHex().data().decode()
        ConfigManager.save(cfg)

    def closeEvent(self, event):
        LogEmitter.info("正在关闭应用程序...")
        self._save_geometry()
        if self.chat_tab._sending:
            self.chat_tab.stop_stream()
            if self.chat_tab.thread and self.chat_tab.thread.isRunning():
                self.chat_tab.thread.quit()
                self.chat_tab.thread.wait(3000)
        event.accept()


# ═══════════════════════════════════════════════════════════════
# Entry Point
# ═══════════════════════════════════════════════════════════════
def main():
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setOrganizationName(APP_ORG)
    app.setStyle("Fusion")

    # Force dark palette as fallback
    from PySide6.QtGui import QPalette, QColor

    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor("#0d1117"))
    palette.setColor(QPalette.ColorRole.WindowText, QColor("#c9d1d9"))
    palette.setColor(QPalette.ColorRole.Base, QColor("#161b22"))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor("#0d1117"))
    palette.setColor(QPalette.ColorRole.Text, QColor("#c9d1d9"))
    palette.setColor(QPalette.ColorRole.Button, QColor("#21262d"))
    palette.setColor(QPalette.ColorRole.ButtonText, QColor("#c9d1d9"))
    palette.setColor(QPalette.ColorRole.Highlight, QColor("#264f78"))
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor("#ffffff"))
    app.setPalette(palette)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
