from flask import Flask, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)

DB_PATH = '/app/brain.db'

def log_event(source, event_type, data):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO criativalia_data (category, key_name, value, updated_at)
            VALUES (?, ?, ?, datetime('now'))
        """, (f'webhook_{source}', event_type, json.dumps(data)))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Erro ao salvar: {e}")

@app.route('/')
def home():
    return jsonify({
        'service': 'Criativalia Webhook Hub',
        'status': 'running',
        'endpoints': [
            '/webhook/shopify',
            '/webhook/evolution',
            '/webhook/zapier'
        ]
    })

@app.route('/webhook/shopify', methods=['POST'])
def shopify_webhook():
    data = request.json
    order_id = data.get('id', 'N/A')
    total = data.get('total_price', '0.00')
    customer = data.get('customer', {}).get('first_name', 'Cliente')
    
    log_event('shopify', 'new_order', {
        'order_id': order_id,
        'total': total,
        'customer': customer
    })
    
    return jsonify({
        'status': 'received',
        'order_id': order_id,
        'total': total
    }), 200

@app.route('/webhook/evolution', methods=['POST'])
def evolution_webhook():
    data = request.json
    log_event('evolution', 'message', data)
    return jsonify({'status': 'received'}), 200

@app.route('/webhook/zapier', methods=['POST'])
def zapier_webhook():
    data = request.json
    log_event('zapier', 'trigger', data)
    return jsonify({'status': 'triggered'}), 200

@app.route('/stats')
def stats():
    return jsonify({
        'status': 'ok',
        'message': 'Stats endpoint ready'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=False)
