import http.server
import socketserver
import urllib.request
import urllib.error
import json
import os
import sys

# CONFIGURATION
PORT = int(os.environ.get('PORT', 8080))
# The System API Key - this stays on the server side
SYSTEM_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
API_ENDPOINT = "https://api.perplexity.ai/chat/completions"

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Security: Prevent serving this script source code
        if self.path.endswith('server.py') or 'server.py' in self.path:
            self.send_error(403, "Access Denied")
            return
        
        # Standard file serving for everything else
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # Handle API Proxy
        if self.path == '/api/analyze':
            self.handle_api_proxy()
        else:
            self.send_error(404, "Not Found")

    def handle_api_proxy(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        # Check for User API Key in headers
        user_key = self.headers.get('Authorization', '').replace('Bearer ', '').strip()
        
        # Determine which key to use
        # If user provides a key (length > 20 to be safe), use it. Otherwise system key.
        final_key = user_key if len(user_key) > 20 else SYSTEM_API_KEY
        
        print(f"Proxying Request. User Key Provided: {len(user_key) > 20}")

        try:
            # Prepare Request to Upstream Provider
            req = urllib.request.Request(
                API_ENDPOINT,
                data=post_data,
                headers={
                    'Authorization': f'Bearer {final_key}',
                    'Content-Type': 'application/json'
                },
                method='POST'
            )
            
            # Execute Request
            with urllib.request.urlopen(req) as response:
                response_body = response.read()
                
                # Send Response back to Client
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_body)
                
        except urllib.error.HTTPError as e:
            print(f"Upstream Error: {e.code} {e.reason}")
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
            
        except Exception as e:
            print(f"Proxy Error: {e}")
            self.send_error(500, f"Internal Proxy Error: {str(e)}")

print(f"Starting Server on port {PORT}...")
print(f"Access at http://localhost:{PORT}/")

# Ensure we are serving from the directory where the script is located
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
