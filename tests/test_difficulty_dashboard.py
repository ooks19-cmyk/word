"""tests/test_difficulty_dashboard.py - 난이도 설정 JSON, 게임 코드 연동, 대시보드 로컬 서버 및 보안 통합 테스트"""

import http.client
import json
import re
import subprocess
import sys
import threading
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import difficulty_dashboard_server as srv


class TestDifficultyConfigAndDashboard(unittest.TestCase):
    def test_01_json_schema_and_defaults(self) -> None:
        # 1. 기본값 상수 정합성 검증
        defaults = srv.DEFAULT_DIFFICULTY_CONFIG
        self.assertEqual(defaults["topOvrMaxCap"], 99)
        self.assertEqual(defaults["leagues"], {"kleague1": 95, "jleague": 97, "ligue1": 98, "epl": 99})
        self.assertEqual(
            defaults["championsLeague"]["ucl"],
            {"bossMaxOvrCap": 101, "strongMaxOvrCap": 99, "darkhorseMaxOvrCap": 97},
        )
        self.assertEqual(
            defaults["championsLeague"]["acl"],
            {"bossMaxOvrCap": 100, "strongMaxOvrCap": 99, "normalMaxOvrCap": 97},
        )
        self.assertEqual(
            defaults["national"]["asia"],
            {"eliteMinOvr": 95, "eliteMaxOvr": 96, "normalMinOvr": 88, "normalMaxOvr": 94},
        )
        self.assertEqual(
            defaults["national"]["world"],
            {"eliteMinOvr": 97, "eliteMaxOvr": 100, "normalMinOvr": 90, "normalMaxOvr": 96},
        )

        # 2. 실제 difficulty_config.json 파일의 스키마 및 허용 범위(50~150) 검증
        raw = json.loads((ROOT / "difficulty_config.json").read_text(encoding="utf-8"))
        sanitized = srv.sanitize_difficulty_config(raw)
        self.assertTrue(50 <= sanitized["topOvrMaxCap"] <= 150)
        for lid in ("kleague1", "jleague", "ligue1", "epl"):
            self.assertIn(lid, raw["leagues"])
            self.assertTrue(50 <= sanitized["leagues"][lid] <= 150)
        for mode in ("ucl", "acl"):
            self.assertIn(mode, raw["championsLeague"])
        for region in ("asia", "world"):
            self.assertIn(region, raw["national"])
            self.assertLessEqual(sanitized["national"][region]["eliteMinOvr"], sanitized["national"][region]["eliteMaxOvr"])
            self.assertLessEqual(sanitized["national"][region]["normalMinOvr"], sanitized["national"][region]["normalMaxOvr"])

    def test_02_sanitize_clamping_and_minmax_normalization(self) -> None:
        sanitized = srv.sanitize_difficulty_config(
            {
                "topOvrMaxCap": 999,
                "leagues": {"kleague1": 10, "epl": "not-a-number"},
                "championsLeague": {"ucl": {"bossMaxOvrCap": 200}},
                "national": {"asia": {"eliteMinOvr": 99, "eliteMaxOvr": 91}},
            }
        )
        self.assertEqual(sanitized["topOvrMaxCap"], 150)
        self.assertEqual(sanitized["leagues"]["kleague1"], 50)
        self.assertEqual(sanitized["leagues"]["epl"], 99)
        self.assertEqual(sanitized["championsLeague"]["ucl"]["bossMaxOvrCap"], 150)
        self.assertEqual(sanitized["national"]["asia"]["eliteMinOvr"], 91)
        self.assertEqual(sanitized["national"]["asia"]["eliteMaxOvr"], 99)

    def test_03_game_files_reference_difficulty_variables(self) -> None:
        match_js = (ROOT / "js" / "match_algorithm.js").read_text(encoding="utf-8")
        league_js = (ROOT / "js" / "league.js").read_text(encoding="utf-8")
        cup_js = (ROOT / "js" / "cup.js").read_text(encoding="utf-8")
        acl_js = (ROOT / "js" / "acl.js").read_text(encoding="utf-8")
        national_js = (ROOT / "js" / "national.js").read_text(encoding="utf-8")
        index_html = (ROOT / "index.html").read_text(encoding="utf-8")
        sw_js = (ROOT / "sw.js").read_text(encoding="utf-8")
        app_js = (ROOT / "app.js").read_text(encoding="utf-8")

        self.assertIn("getTopOvrMaxCap", match_js)
        self.assertIn("getLeagueMaxOvrCap('kleague1')", league_js)
        self.assertIn("getLeagueMaxOvrCap('epl')", league_js)
        self.assertIn("getLeagueMaxOvrCap('jleague')", league_js)
        self.assertIn("getLeagueMaxOvrCap('ligue1')", league_js)
        self.assertIn("getLeagueMaxOvrCap", cup_js)
        self.assertIn("getChampionsLeagueOvrCaps('ucl')", acl_js)
        self.assertIn("getChampionsLeagueOvrCaps('acl')", acl_js)
        self.assertIn("getNationalOvrConfig('asia')", national_js)
        self.assertIn("getNationalOvrConfig('world')", national_js)
        self.assertIn('src="js/difficulty_config.js?v=1.0"', index_html)
        self.assertIn("'./difficulty_config.json'", sw_js)
        self.assertIn("'./js/difficulty_config.js'", sw_js)
        self.assertIn("loadDifficultyConfig()", app_js)

        # index.html 로드 순서: difficulty_config.js가 match_algorithm.js보다 먼저 로드되어야 함
        self.assertLess(
            index_html.index("js/difficulty_config.js"),
            index_html.index("js/match_algorithm.js"),
        )

    def test_04_frontend_security_no_unsafe_sinks(self) -> None:
        dash_html = (ROOT / "difficulty_dashboard.html").read_text(encoding="utf-8")
        dash_js = (ROOT / "js" / "difficulty_dashboard.js").read_text(encoding="utf-8")

        self.assertIsNone(re.search(r"\bon[a-z]+\s*=", dash_html, re.IGNORECASE))
        self.assertIsNone(re.search(r"innerHTML|outerHTML|insertAdjacentHTML|document\.write", dash_js))
        self.assertIsNone(re.search(r"\b(alert|confirm|prompt)\s*\(", dash_js))

    def test_05_server_api_security_and_git_push_flow(self) -> None:
        tmp_cfg = ROOT / "tests" / ".tmp_difficulty_config.json"
        tmp_cfg.write_text((ROOT / "difficulty_config.json").read_text(encoding="utf-8"), encoding="utf-8")

        git_calls: list[list[str]] = []

        def mock_git(args: list[str]) -> subprocess.CompletedProcess[str]:
            git_calls.append(args)
            if args[:2] == ["rev-parse", "--abbrev-ref"]:
                return subprocess.CompletedProcess(args, 0, "main\n", "")
            if args[:2] == ["rev-parse", "--short"]:
                return subprocess.CompletedProcess(args, 0, "a1b2c3d\n", "")
            if args[0] == "status":
                return subprocess.CompletedProcess(args, 0, " M difficulty_config.json\n", "")
            if args[0] == "log":
                return subprocess.CompletedProcess(args, 0, "a1b2c3d test\n", "")
            if args[0] == "diff":
                return subprocess.CompletedProcess(args, 1, "", "")
            if args[0] == "rev-list":
                return subprocess.CompletedProcess(args, 0, "1\n", "")
            return subprocess.CompletedProcess(args, 0, "ok\n", "")

        # 0.0.0.0 바인딩 차단 확인
        with self.assertRaises(ValueError):
            srv.create_dashboard_server(host="0.0.0.0", port=0, config_path=tmp_cfg, git_executor=mock_git)

        server, _ = srv.create_dashboard_server(host="127.0.0.1", port=0, config_path=tmp_cfg, git_executor=mock_git)
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            # 1) 메인 진입 및 보안 헤더·세션 쿠키 발급 확인
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
            conn.request("GET", "/")
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 200)
            self.assertIn("script-src 'self'", res.getheader("Content-Security-Policy", ""))
            self.assertEqual(res.getheader("X-Content-Type-Options"), "nosniff")
            self.assertEqual(res.getheader("X-Frame-Options"), "DENY")
            set_cookie = res.getheader("Set-Cookie", "")
            self.assertIn("HttpOnly", set_cookie)
            self.assertIn("SameSite=Strict", set_cookie)
            session_cookie = set_cookie.split(";")[0]

            # 2) 세션 없이 API 접근 차단 (401)
            conn.request("GET", "/api/config")
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 401)

            # 3) 경로 탐색 차단 (404)
            conn.request("GET", "/../../Windows/win.ini")
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 404)

            # 4) 비허용 HTTP 메서드 차단 (405)
            conn.request("DELETE", "/api/config")
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 405)

            # 5) 세션 쿠키로 CSRF 토큰 획득
            conn.request("GET", "/api/session", headers={"Cookie": session_cookie})
            res = conn.getresponse()
            sess_data = json.loads(res.read().decode("utf-8"))
            self.assertEqual(res.status, 200)
            csrf_token = sess_data["csrfToken"]
            self.assertGreaterEqual(len(csrf_token), 32)

            # 6) CSRF 없이 POST 차단 (403)
            conn.request(
                "POST",
                "/api/config",
                body=json.dumps({"config": srv.DEFAULT_DIFFICULTY_CONFIG}),
                headers={"Cookie": session_cookie, "Content-Type": "application/json"},
            )
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 403)

            # 7) 외부 Origin 차단 (403)
            conn.request(
                "POST",
                "/api/config",
                body=json.dumps({"config": srv.DEFAULT_DIFFICULTY_CONFIG}),
                headers={
                    "Cookie": session_cookie,
                    "X-CSRF-Token": csrf_token,
                    "Content-Type": "application/json",
                    "Origin": "https://evil.example",
                },
            )
            res = conn.getresponse()
            _ = res.read()
            self.assertEqual(res.status, 403)

            # 8) 정상 저장 테스트
            updated = json.loads(json.dumps(srv.DEFAULT_DIFFICULTY_CONFIG))
            updated["leagues"]["kleague1"] = 96
            updated["championsLeague"]["ucl"]["bossMaxOvrCap"] = 102
            conn.request(
                "POST",
                "/api/config",
                body=json.dumps({"config": updated}),
                headers={
                    "Cookie": session_cookie,
                    "X-CSRF-Token": csrf_token,
                    "Content-Type": "application/json",
                },
            )
            res = conn.getresponse()
            save_body = json.loads(res.read().decode("utf-8"))
            self.assertEqual(res.status, 200)
            self.assertTrue(save_body["changed"])
            self.assertEqual(save_body["config"]["leagues"]["kleague1"], 96)
            disk_saved = json.loads(tmp_cfg.read_text(encoding="utf-8"))
            self.assertEqual(disk_saved["championsLeague"]["ucl"]["bossMaxOvrCap"], 102)

            # 9) 정상 Git Push 및 커밋 메시지 정제 + 단일 파일 스테이징 확인
            conn.request(
                "POST",
                "/api/git-push",
                body=json.dumps(
                    {"config": updated, "commitMessage": "chore: K리그 96, UCL 보스 102 조정\n--amend"}
                ),
                headers={
                    "Cookie": session_cookie,
                    "X-CSRF-Token": csrf_token,
                    "Content-Type": "application/json",
                },
            )
            res = conn.getresponse()
            push_body = json.loads(res.read().decode("utf-8"))
            self.assertEqual(res.status, 200)
            self.assertTrue(push_body["pushed"])
            self.assertEqual(push_body["commitHash"], "a1b2c3d")
            self.assertIn(["add", "--", "difficulty_config.json"], git_calls)
            commit_calls = [c for c in git_calls if c and c[0] == "commit"]
            self.assertEqual(len(commit_calls), 1)
            self.assertNotIn("\n", commit_calls[0][2])
            self.assertEqual(commit_calls[0][4], "difficulty_config.json")
            self.assertIn(["push", "origin", "main"], git_calls)

            conn.close()
        finally:
            server.shutdown()
            server.server_close()
            if tmp_cfg.exists():
                tmp_cfg.unlink()


if __name__ == "__main__":
    unittest.main(verbosity=2)
