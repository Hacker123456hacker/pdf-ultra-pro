#!/usr/bin/env python3
"""One-time local YouTube OAuth helper.

Run this on your own phone/PC, never in GitHub Actions. It prints the refresh token
that should be copied into the GitHub Actions secret YOUTUBE_REFRESH_TOKEN.
"""
import json
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
CLIENT = Path("client_secret.json")

if not CLIENT.exists():
    raise SystemExit("Put your downloaded Google OAuth client JSON beside this script as client_secret.json")

flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES)
creds = flow.run_local_server(port=8080, open_browser=False, access_type="offline", prompt="consent")
print("\n=== YOUTUBE_REFRESH_TOKEN ===")
print(creds.refresh_token or "No refresh token returned; revoke the old grant and run again with prompt=consent.")
print("=== END TOKEN ===")
print("Copy only the token value into GitHub Actions secret YOUTUBE_REFRESH_TOKEN.")
