"""difficulty_dashboard_server.py - FC STAR 난이도 설정 관리 & 원클릭 Git Push 로컬 서버

보안 수칙:
- 127.0.0.1 루프백 전용 바인딩 (0.0.0.0 금지)
- 외부 라이브러리 제로 (Python 3 표준 라이브러리 전용)
- 메모리 난수 세션 쿠키(HttpOnly; SameSite=Strict) + X-CSRF-Token 타이밍-안전 검증
- 엄격한 CSP/보안 헤더, HTTP 메서드 Allow-list(GET, POST), 정적 파일 화이트리스트
- subprocess.run(..., shell=False) 고정 git 인자 리스트 실행 및 difficulty_config.json 단일 파일만 스테이징
"""

from __future__ import annotations

import datetime
import hmac
import json
import os
import re
import secrets
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable

PROJECT_ROOT = Path(__file__).resolve().parent
CONFIG_FILE_PATH = (PROJECT_ROOT / "difficulty_config.json").resolve()

MAX_BODY_BYTES = 32 * 1024  # 32 KB
RATE_LIMIT_WINDOW_SEC = 60.0
RATE_LIMIT_MAX_REQUESTS = 120
GIT_PUSH_COOLDOWN_SEC = 3.0

DEFAULT_DIFFICULTY_CONFIG: dict[str, Any] = {
    "version": "1.0.0",
    "updatedAt": "2026-11-26T10:20:00+09:00",
    "topOvrMaxCap": 99,
    "leagues": {
        "kleague1": 95,
        "jleague": 97,
        "ligue1": 98,
        "epl": 99,
    },
    "championsLeague": {
        "ucl": {
            "bossMaxOvrCap": 101,
            "strongMaxOvrCap": 99,
            "darkhorseMaxOvrCap": 97,
        },
        "acl": {
            "bossMaxOvrCap": 100,
            "strongMaxOvrCap": 99,
            "normalMaxOvrCap": 97,
        },
    },
    "national": {
        "asia": {
            "eliteMinOvr": 95,
            "eliteMaxOvr": 96,
            "normalMinOvr": 88,
            "normalMaxOvr": 94,
        },
        "world": {
            "eliteMinOvr": 97,
            "eliteMaxOvr": 100,
            "normalMinOvr": 90,
            "normalMaxOvr": 96,
        },
    },
}

STATIC_ALLOWLIST: dict[str, tuple[Path, str, bool]] = {
    "/": ((PROJECT_ROOT / "difficulty_dashboard.html").resolve(), "text/html; charset=utf-8", True),
    "/difficulty_dashboard.html": ((PROJECT_ROOT / "difficulty_dashboard.html").resolve(), "text/html; charset=utf-8", True),
    "/css/difficulty_dashboard.css": ((PROJECT_ROOT / "css" / "difficulty_dashboard.css").resolve(), "text/css; charset=utf-8", False),
    "/js/difficulty_dashboard.js": ((PROJECT_ROOT / "js" / "difficulty_dashboard.js").resolve(), "application/javascript; charset=utf-8", False),
    "/js/difficulty_config.js": ((PROJECT_ROOT / "js" / "difficulty_config.js").resolve(), "application/javascript; charset=utf-8", False),
    "/difficulty_config.json": (CONFIG_FILE_PATH, "application/json; charset=utf-8", False),
}


def is_within_project_root(target: Path) -> bool:
    resolved = target.resolve()
    root_str = str(PROJECT_ROOT)
    prefix = root_str if root_str.endswith(os.sep) else root_str + os.sep
    return str(resolved).startswith(prefix)


def get_kst_iso_timestamp() -> str:
    kst = datetime.timezone(datetime.timedelta(hours=9))
    return datetime.datetime.now(kst).replace(microsecond=0).isoformat()


def to_safe_int(value: Any, fallback: int, min_val: int, max_val: int) -> int:
    if isinstance(value, bool):
        return fallback
    try:
        num = int(float(value))
    except (TypeError, ValueError, OverflowError):
        return fallback
    if num < min_val:
        return min_val
    if num > max_val:
        return max_val
    return num


def sanitize_difficulty_config(raw: Any) -> dict[str, Any]:
    base = json.loads(json.dumps(DEFAULT_DIFFICULTY_CONFIG))
    if not isinstance(raw, dict):
        return base

    version = raw.get("version")
    if isinstance(version, str) and 0 < len(version.strip()) <= 32:
        base["version"] = version.strip()

    updated_at = raw.get("updatedAt")
    if isinstance(updated_at, str) and 0 < len(updated_at.strip()) <= 64:
        base["updatedAt"] = updated_at.strip()

    base["topOvrMaxCap"] = to_safe_int(raw.get("topOvrMaxCap"), base["topOvrMaxCap"], 50, 150)

    raw_leagues = raw.get("leagues")
    if isinstance(raw_leagues, dict):
        for league_id in base["leagues"]:
            val = raw_leagues.get(league_id)
            if isinstance(val, dict):
                val = val.get("maxOvrCap")
            base["leagues"][league_id] = to_safe_int(val, base["leagues"][league_id], 50, 150)

    raw_cl = raw.get("championsLeague")
    if isinstance(raw_cl, dict):
        raw_ucl = raw_cl.get("ucl")
        if isinstance(raw_ucl, dict):
            dst = base["championsLeague"]["ucl"]
            dst["bossMaxOvrCap"] = to_safe_int(raw_ucl.get("bossMaxOvrCap"), dst["bossMaxOvrCap"], 50, 150)
            dst["strongMaxOvrCap"] = to_safe_int(raw_ucl.get("strongMaxOvrCap"), dst["strongMaxOvrCap"], 50, 150)
            dst["darkhorseMaxOvrCap"] = to_safe_int(raw_ucl.get("darkhorseMaxOvrCap"), dst["darkhorseMaxOvrCap"], 50, 150)

        raw_acl = raw_cl.get("acl")
        if isinstance(raw_acl, dict):
            dst = base["championsLeague"]["acl"]
            dst["bossMaxOvrCap"] = to_safe_int(raw_acl.get("bossMaxOvrCap"), dst["bossMaxOvrCap"], 50, 150)
            dst["strongMaxOvrCap"] = to_safe_int(raw_acl.get("strongMaxOvrCap"), dst["strongMaxOvrCap"], 50, 150)
            dst["normalMaxOvrCap"] = to_safe_int(raw_acl.get("normalMaxOvrCap"), dst["normalMaxOvrCap"], 50, 150)

    raw_nat = raw.get("national")
    if isinstance(raw_nat, dict):
        for region in ("asia", "world"):
            src = raw_nat.get(region)
            if not isinstance(src, dict):
                continue
            dst = base["national"][region]
            e_min = to_safe_int(src.get("eliteMinOvr"), dst["eliteMinOvr"], 50, 150)
            e_max = to_safe_int(src.get("eliteMaxOvr"), dst["eliteMaxOvr"], 50, 150)
            dst["eliteMinOvr"], dst["eliteMaxOvr"] = (e_min, e_max) if e_min <= e_max else (e_max, e_min)
            n_min = to_safe_int(src.get("normalMinOvr"), dst["normalMinOvr"], 50, 150)
            n_max = to_safe_int(src.get("normalMaxOvr"), dst["normalMaxOvr"], 50, 150)
            dst["normalMinOvr"], dst["normalMaxOvr"] = (n_min, n_max) if n_min <= n_max else (n_max, n_min)

    return base


def sanitize_commit_message(raw: Any) -> str:
    fallback = "chore: 난이도 오버롤 설정 업데이트"
    if not isinstance(raw, str):
        return fallback
    cleaned = re.sub(r"[\r\n\t\x00-\x1f\x7f]", " ", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()[:100]
    if not cleaned or cleaned.startswith("-"):
        return fallback
    return cleaned


def _values_equal(a: dict[str, Any], b: dict[str, Any]) -> bool:
    keys = ("topOvrMaxCap", "leagues", "championsLeague", "national")
    return all(a.get(k) == b.get(k) for k in keys)


def read_config_from_disk(config_path: Path = CONFIG_FILE_PATH) -> dict[str, Any]:
    if not is_within_project_root(config_path):
        raise PermissionError("허용되지 않은 경로입니다.")
    try:
        raw_text = config_path.read_text(encoding="utf-8")
        return sanitize_difficulty_config(json.loads(raw_text))
    except Exception:
        return sanitize_difficulty_config(DEFAULT_DIFFICULTY_CONFIG)


def write_config_to_disk(next_raw: Any, config_path: Path = CONFIG_FILE_PATH) -> tuple[dict[str, Any], bool]:
    if not is_within_project_root(config_path):
        raise PermissionError("허용되지 않은 경로입니다.")
    current = read_config_from_disk(config_path)
    sanitized = sanitize_difficulty_config(next_raw)
    if _values_equal(current, sanitized):
        sanitized["updatedAt"] = current["updatedAt"]
        return sanitized, False
    sanitized["updatedAt"] = get_kst_iso_timestamp()
    config_path.write_text(json.dumps(sanitized, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return sanitized, True


def run_git(args: list[str], cwd: Path = PROJECT_ROOT) -> subprocess.CompletedProcess[str]:
    if not isinstance(args, list) or not args:
        raise ValueError("잘못된 git 명령입니다.")
    # 쉘을 거치지 않고(shell=False) 고정 인자 리스트로만 실행
    creationflags = subprocess.CREATE_NO_WINDOW if os.name == "nt" and hasattr(subprocess, "CREATE_NO_WINDOW") else 0
    return subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
        shell=False,
        creationflags=creationflags,
    )


def is_allowed_local_origin(origin_header: str | None, host_header: str | None) -> bool:
    if not origin_header:
        return True
    try:
        parsed = urllib.parse.urlparse(origin_header)
        if parsed.scheme != "http" or parsed.hostname not in ("127.0.0.1", "localhost"):
            return False
        if host_header:
            expected_port = host_header.split(":")[1] if ":" in host_header else "80"
            origin_port = str(parsed.port or 80)
            if expected_port != origin_port:
                return False
        return True
    except Exception:
        return False


class DashboardAppState:
    def __init__(
        self,
        config_path: Path = CONFIG_FILE_PATH,
        git_executor: Callable[[list[str]], subprocess.CompletedProcess[str]] = run_git,
    ) -> None:
        self.config_path = config_path.resolve()
        self.git_executor = git_executor
        self.session_token = secrets.token_hex(32)
        self.csrf_token = secrets.token_hex(32)
        self._lock = threading.Lock()
        self._rate_buckets: dict[str, tuple[int, float]] = {}
        self._last_git_push_at = 0.0

    def allow_request(self, client_ip: str) -> bool:
        now = time.monotonic()
        with self._lock:
            count, window_start = self._rate_buckets.get(client_ip, (0, now))
            if now - window_start >= RATE_LIMIT_WINDOW_SEC:
                self._rate_buckets[client_ip] = (1, now)
                return True
            if count >= RATE_LIMIT_MAX_REQUESTS:
                return False
            self._rate_buckets[client_ip] = (count + 1, window_start)
            return True

    def allow_git_push(self) -> bool:
        now = time.monotonic()
        with self._lock:
            if now - self._last_git_push_at < GIT_PUSH_COOLDOWN_SEC:
                return False
            self._last_git_push_at = now
            return True


def make_handler(app_state: DashboardAppState) -> type[BaseHTTPRequestHandler]:
    class DifficultyDashboardHandler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: Any) -> None:
            # 민감 정보(쿠키·토큰 등)를 남기지 않고 간단한 경로 로그만 출력
            return

        def _send_security_headers(self) -> None:
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
                "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; "
                "form-action 'self'; frame-ancestors 'none'",
            )
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
            self.send_header("Cache-Control", "no-store")

        def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status_code)
            self._send_security_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _send_method_not_allowed(self) -> None:
            body = json.dumps({"error": "허용되지 않은 HTTP 메서드입니다."}, ensure_ascii=False).encode("utf-8")
            self.send_response(405)
            self._send_security_headers()
            self.send_header("Allow", "GET, POST")
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _verify_api_auth(self, require_csrf: bool) -> bool:
            if not is_allowed_local_origin(self.headers.get("Origin"), self.headers.get("Host")):
                self._send_json(403, {"error": "허용되지 않은 Origin입니다."})
                return False

            raw_cookie = self.headers.get("Cookie", "")
            jar = cookies.SimpleCookie()
            try:
                jar.load(raw_cookie)
            except Exception:
                pass
            session_val = jar["fc_diff_session"].value if "fc_diff_session" in jar else ""
            if not hmac.compare_digest(session_val, app_state.session_token):
                self._send_json(401, {"error": "유효한 로컬 대시보드 세션이 없습니다. 대시보드 페이지를 새로고침하세요."})
                return False

            if require_csrf:
                provided_csrf = self.headers.get("X-CSRF-Token", "")
                if not hmac.compare_digest(provided_csrf, app_state.csrf_token):
                    self._send_json(403, {"error": "CSRF 토큰 검증에 실패했습니다."})
                    return False

            return True

        def _read_json_body(self) -> dict[str, Any] | None:
            content_type = (self.headers.get("Content-Type") or "").lower()
            if "application/json" not in content_type:
                self._send_json(415, {"error": "application/json 형식이 필요합니다."})
                return None

            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._send_json(400, {"error": "잘못된 Content-Length 헤더입니다."})
                return None

            if length < 0 or length > MAX_BODY_BYTES:
                self._send_json(413, {"error": "요청 크기가 허용 한도를 초과했습니다."})
                return None

            raw = self.rfile.read(length) if length > 0 else b"{}"
            try:
                parsed = json.loads(raw.decode("utf-8"))
            except Exception:
                self._send_json(400, {"error": "유효한 JSON 본문이 아닙니다."})
                return None

            if not isinstance(parsed, dict):
                self._send_json(400, {"error": "JSON 객체 형식이어야 합니다."})
                return None
            return parsed

        def do_GET(self) -> None:
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            if not app_state.allow_request(client_ip):
                self._send_json(429, {"error": "요청이 너무 많습니다. 잠시 후 다시 시도하세요."})
                return

            pathname = urllib.parse.urlparse(self.path).path

            # 1. 정적 파일 서빙 (화이트리스트)
            if pathname in STATIC_ALLOWLIST:
                file_path, content_type, is_entry = STATIC_ALLOWLIST[pathname]
                if not is_within_project_root(file_path) or not file_path.is_file():
                    self._send_json(404, {"error": "파일을 찾을 수 없습니다."})
                    return
                data = file_path.read_bytes()
                self.send_response(200)
                self._send_security_headers()
                if is_entry:
                    # TODO(security): 로컬 127.0.0.1 HTTP 전용 관리 도구이므로 HTTPS 전용 Secure/__Host- 대신 HttpOnly; SameSite=Strict 세션 쿠키를 사용합니다.
                    self.send_header(
                        "Set-Cookie",
                        f"fc_diff_session={app_state.session_token}; HttpOnly; SameSite=Strict; Path=/",
                    )
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return

            # 2. API GET 라우팅
            if pathname == "/api/session":
                if not self._verify_api_auth(require_csrf=False):
                    return
                self._send_json(200, {"ok": True, "csrfToken": app_state.csrf_token})
                return

            if pathname == "/api/config":
                if not self._verify_api_auth(require_csrf=False):
                    return
                config = read_config_from_disk(app_state.config_path)
                self._send_json(200, {"ok": True, "config": config})
                return

            if pathname == "/api/git-status":
                if not self._verify_api_auth(require_csrf=False):
                    return
                try:
                    branch_res = app_state.git_executor(["rev-parse", "--abbrev-ref", "HEAD"])
                    branch = (branch_res.stdout or "main").strip() or "main"
                    status_res = app_state.git_executor(["status", "--short", "--", "difficulty_config.json"])
                    log_res = app_state.git_executor(["log", "-n", "5", "--oneline"])
                    ahead_res = app_state.git_executor(["rev-list", "--count", f"origin/{branch}..HEAD"])
                    ahead_count = int(ahead_res.stdout.strip()) if ahead_res.returncode == 0 and ahead_res.stdout.strip().isdigit() else 0
                    status_raw = (status_res.stdout or "").strip()
                    commits = [line for line in (log_res.stdout or "").splitlines() if line.strip()]
                    self._send_json(
                        200,
                        {
                            "ok": True,
                            "branch": branch,
                            "fileStatusRaw": status_raw,
                            "fileStatusText": f"수정됨 ({status_raw})" if status_raw else "최신 상태 (변경 없음)",
                            "aheadCount": ahead_count,
                            "recentCommits": commits,
                        },
                    )
                except Exception as exc:
                    msg = str(exc).splitlines()[0][:200] if str(exc) else "Git 상태 조회 실패"
                    self._send_json(500, {"error": msg})
                return

            self._send_json(404, {"error": "요청한 경로를 찾을 수 없습니다."})

        def do_POST(self) -> None:
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            if not app_state.allow_request(client_ip):
                self._send_json(429, {"error": "요청이 너무 많습니다. 잠시 후 다시 시도하세요."})
                return

            pathname = urllib.parse.urlparse(self.path).path

            if pathname not in ("/api/config", "/api/git-push"):
                self._send_json(404, {"error": "요청한 경로를 찾을 수 없습니다."})
                return

            if not self._verify_api_auth(require_csrf=True):
                return

            body = self._read_json_body()
            if body is None:
                return

            if pathname == "/api/config":
                if not isinstance(body.get("config"), dict):
                    self._send_json(400, {"error": "설정 객체(config)가 필요합니다."})
                    return
                try:
                    saved_cfg, changed = write_config_to_disk(body["config"], app_state.config_path)
                    self._send_json(200, {"ok": True, "config": saved_cfg, "changed": changed})
                except Exception:
                    self._send_json(500, {"error": "설정 파일 저장 중 오류가 발생했습니다."})
                return

            if pathname == "/api/git-push":
                if not app_state.allow_git_push():
                    self._send_json(429, {"error": "Git Push는 3초 간격으로 실행할 수 있습니다."})
                    return

                try:
                    if isinstance(body.get("config"), dict):
                        active_cfg, _ = write_config_to_disk(body["config"], app_state.config_path)
                    else:
                        active_cfg = read_config_from_disk(app_state.config_path)

                    safe_msg = sanitize_commit_message(body.get("commitMessage"))
                    branch_res = app_state.git_executor(["rev-parse", "--abbrev-ref", "HEAD"])
                    if branch_res.returncode != 0:
                        self._send_json(500, {"error": "현재 Git 브랜치를 확인할 수 없습니다."})
                        return
                    branch = (branch_res.stdout or "main").strip()
                    if not re.match(r"^[a-zA-Z0-9._/-]+$", branch) or branch.startswith("-"):
                        self._send_json(400, {"error": "유효하지 않은 브랜치 이름입니다."})
                        return

                    # 오직 difficulty_config.json 단일 파일만 스테이징
                    add_res = app_state.git_executor(["add", "--", "difficulty_config.json"])
                    if add_res.returncode != 0:
                        err_line = (add_res.stderr or add_res.stdout or "git add 실패").splitlines()[0][:200]
                        self._send_json(500, {"error": err_line})
                        return

                    diff_res = app_state.git_executor(["diff", "--cached", "--quiet", "--", "difficulty_config.json"])
                    has_staged_diff = diff_res.returncode == 1
                    if diff_res.returncode not in (0, 1):
                        self._send_json(500, {"error": "Git 변경 사항 비교에 실패했습니다."})
                        return

                    outputs: list[str] = []
                    if has_staged_diff:
                        commit_res = app_state.git_executor(
                            ["commit", "-m", safe_msg, "--", "difficulty_config.json"]
                        )
                        if commit_res.returncode != 0:
                            err_line = (commit_res.stderr or commit_res.stdout or "git commit 실패").splitlines()[0][:200]
                            self._send_json(500, {"error": err_line})
                            return
                        if commit_res.stdout.strip():
                            outputs.append(commit_res.stdout.strip())

                    ahead_res = app_state.git_executor(["rev-list", "--count", f"origin/{branch}..HEAD"])
                    ahead_count = (
                        int(ahead_res.stdout.strip())
                        if ahead_res.returncode == 0 and ahead_res.stdout.strip().isdigit()
                        else (1 if has_staged_diff else 0)
                    )

                    if not has_staged_diff and ahead_count == 0:
                        head_res = app_state.git_executor(["rev-parse", "--short", "HEAD"])
                        self._send_json(
                            200,
                            {
                                "ok": True,
                                "pushed": False,
                                "branch": branch,
                                "commitHash": (head_res.stdout or "").strip(),
                                "config": active_cfg,
                                "message": "difficulty_config.json에 새로 푸시할 변경 사항이 없습니다.",
                                "output": "",
                            },
                        )
                        return

                    push_res = app_state.git_executor(["push", "origin", branch])
                    if push_res.returncode != 0:
                        err_line = (push_res.stderr or push_res.stdout or "git push 실패").splitlines()[0][:200]
                        self._send_json(500, {"error": err_line})
                        return

                    if push_res.stdout.strip():
                        outputs.append(push_res.stdout.strip())
                    if push_res.stderr.strip():
                        outputs.append(push_res.stderr.strip())

                    head_res = app_state.git_executor(["rev-parse", "--short", "HEAD"])
                    self._send_json(
                        200,
                        {
                            "ok": True,
                            "pushed": True,
                            "branch": branch,
                            "commitHash": (head_res.stdout or "").strip(),
                            "config": active_cfg,
                            "message": (
                                f"difficulty_config.json 커밋 및 origin/{branch} 푸시 완료!"
                                if has_staged_diff
                                else f"미푸시 커밋을 origin/{branch}로 푸시 완료!"
                            ),
                            "output": "\n".join(outputs),
                        },
                    )
                except Exception as exc:
                    msg = str(exc).splitlines()[0][:200] if str(exc) else "Git Push 처리 중 오류가 발생했습니다."
                    self._send_json(500, {"error": msg})
                return

        def do_PUT(self) -> None:
            self._send_method_not_allowed()

        def do_DELETE(self) -> None:
            self._send_method_not_allowed()

        def do_PATCH(self) -> None:
            self._send_method_not_allowed()

        def do_TRACE(self) -> None:
            self._send_method_not_allowed()

        def do_OPTIONS(self) -> None:
            self._send_method_not_allowed()

    return DifficultyDashboardHandler


def create_dashboard_server(
    host: str = "127.0.0.1",
    port: int = 4173,
    config_path: Path = CONFIG_FILE_PATH,
    git_executor: Callable[[list[str]], subprocess.CompletedProcess[str]] = run_git,
) -> tuple[ThreadingHTTPServer, DashboardAppState]:
    if host not in ("127.0.0.1", "localhost"):
        raise ValueError("보안 정책상 127.0.0.1 또는 localhost만 바인딩할 수 있습니다.")
    state = DashboardAppState(config_path=config_path, git_executor=git_executor)
    server = ThreadingHTTPServer((host, port), make_handler(state))
    return server, state


def main() -> None:
    env_port = os.environ.get("PORT", "4173")
    try:
        port = int(env_port)
        if not (1024 <= port <= 65535):
            port = 4173
    except ValueError:
        port = 4173

    host = "127.0.0.1"
    should_open = "--open" in sys.argv[1:]

    server, _ = create_dashboard_server(host=host, port=port)
    url = f"http://{host}:{port}/"
    print("====================================================")
    print("  FC STAR CARD 난이도 조절 대시보드 서버 실행 중")
    print(f"  접속 주소: {url}")
    print("  종료하려면 이 창에서 Ctrl + C를 누르세요.")
    print("====================================================")

    if should_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
