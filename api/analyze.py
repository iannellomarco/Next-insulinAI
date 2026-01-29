from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.error
import os
import json

# Configuration
SYSTEM_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
API_ENDPOINT = "https://api.perplexity.ai/chat/completions"

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Only handle analyzer endpoint
        if self.path.endswith('/api/analyze') or self.path == '/api/analyze':
            self.handle_api_proxy()
        else:
            self.send_error(404, "Not Found")

    def handle_api_proxy(self):
        content_length_header = self.headers.get('Content-Length')
        content_length = int(content_length_header) if content_length_header else 0
        post_data = self.rfile.read(content_length)
        
        # Check for User API Key in headers
        user_key = self.headers.get('Authorization', '').replace('Bearer ', '').strip()
        
        # Determine which key to use
        final_key = user_key if len(user_key) > 20 else SYSTEM_API_KEY
        
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
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
            
        except Exception as e:
            self.send_error(500, f"Internal Proxy Error: {str(e)}")
