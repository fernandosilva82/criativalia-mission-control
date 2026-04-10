#!/usr/bin/env python3
"""
Criativalia Webhook Hub
Recebe webhooks de Shopify e outros serviços, envia notificações
"""

from flask import Flask, request, jsonify
import sqlite3
import json
import requests
from datetime import datetime
import os

app = Flask(__name__)

# Config
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'seu_token_aqui')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '8601547557')
DB_PATH = '/home/openclaw/memory/brain.db'

def send_telegram(message):
    """Envia mensagem para Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'Markdown'
        }
        requests.post(url, json=data, timeout=5)
    except Exception as e:
        print(f"Erro ao enviar Telegram: {e}")

def log_event(source, event_type, data):
    """Salva evento no banco de dados"""
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
        print(f"Erro ao salvar log: {e}")

@app.route('/')
def home():
    return jsonify({
        'status': 'ok',
        'service': 'Criativalia Webhook Hub',
        'endpoints': [
            '/webhook/shopify/orders',
            '/webhook/shopify/customers',
            '/webhook/shopify/abandoned_cart',
            '/webhook/evolution/message',
            '/webhook/zapier/trigger'
        ]
    })

@app.route('/webhook/shopify/orders', methods=['POST'])
def shopify_order():
    """Recebe novos pedidos do Shopify"""
    data = request.json
    
    # Extrair dados relevantes
    order_id = data.get('id', 'N/A')
    total = data.get('total_price', '0.00')
    currency = data.get('currency', 'BRL')
    customer = data.get('customer', {})
    customer_name = customer.get('first_name', 'Cliente')
    items = len(data.get('line_items', []))
    
    # Log no banco
    log_event('shopify', 'new_order', {
        'order_id': order_id,
        'total': total,
        'customer': customer_name,
        'items': items
    })
    
    # Notificação Telegram
    message = f"""🛒 *NOVO PEDIDO!*

💰 Total: {currency} {total}
👤 Cliente: {customer_name}
📦 Itens: {items}
🆔 Pedido: #{order_id}

🚀 Hora: {datetime.now().strftime('%H:%M:%S')}"""
    
    send_telegram(message)
    
    return jsonify({'status': 'received', 'type': 'order'}), 200

@app.route('/webhook/shopify/abandoned_cart', methods=['POST'])
def shopify_abandoned():
    """Carrinho abandonado"""
    data = request.json
    
    customer = data.get('customer', {})
    customer_name = customer.get('first_name', 'Cliente')
    cart_value = data.get('total_price', '0.00')
    items = len(data.get('line_items', []))
    
    log_event('shopify', 'abandoned_cart', data)
    
    message = f"""🛍️ *CARRINHO ABANDONADO*

👤 Cliente: {customer_name}
💰 Valor: R$ {cart_value}
📦 Itens: {items}

💡 Oportunidade de recuperação!"""
    
    send_telegram(message)
    
    return jsonify({'status': 'received', 'type': 'abandoned_cart'}), 200

@app.route('/webhook/evolution/message', methods=['POST'])
def evolution_message():
    """Recebe mensagens do Evolution API"""
    data = request.json
    
    message = data.get('message', {})
    sender = message.get('sender', 'Desconhecido')
    text = message.get('text', '')
    
    log_event('evolution', 'whatsapp_message', {
        'sender': sender,
        'text': text[:100]  # Limita tamanho
    })
    
    # Se mensagem contém palavras-chave, notifica
    keywords = ['comprar', 'preço', 'frete', 'disponível', 'interesse']
    if any(kw in text.lower() for kw in keywords):
        alert = f"""💬 *LEAD INTERESSADO!*

👤 {sender}
💬 "{text[:200]}..."

🎯 Palavra-chave detectada!"""
        send_telegram(alert)
    
    return jsonify({'status': 'received', 'type': 'whatsapp'}), 200

@app.route('/webhook/zapier/trigger', methods=['POST'])
def zapier_trigger():
    """Endpoint genérico para automações Zapier/Make"""
    data = request.json
    
    event_type = data.get('event_type', 'generic')
    message_text = data.get('message', 'Evento recebido')
    
    log_event('zapier', event_type, data)
    
    send_telegram(f"⚡ *Automação Zapier*\n\n{message_text}")
    
    return jsonify({'status': 'triggered'}), 200

@app.route('/stats')
def stats():
    """Estatísticas de webhooks recebidos"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM criativalia_data 
            WHERE category LIKE 'webhook_%'
            GROUP BY category
        """)
        
        stats = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        
        return jsonify({
            'webhooks_received': stats,
            'total': sum(stats.values())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=False)
