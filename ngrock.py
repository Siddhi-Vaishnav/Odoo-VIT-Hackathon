!pip install streamlit pandas plotly pyngrok -q

from pyngrok import ngrok
ngrok.kill()

ngrok.set_auth_token("3Bc50DaualXCPFtHOElwdo9Qo21_3zU4S9czwMCjoaRfErppP")

import subprocess
import time
process = subprocess.Popen(["streamlit", "run", "app.py", "--server.port", "8501", "--server.headless", "true"])

time.sleep(5)

public_url = ngrok.connect(8501)
print(f"✅ LIVE DASHBOARD: {public_url}")