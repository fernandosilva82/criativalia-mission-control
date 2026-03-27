/**
 * Night Watch Agent - Monitoramento noturno
 * Versão simplificada e estável
 */

export class NightWatchAgent {
  constructor() {
    this.id = 'night_watch';
    this.name = 'Night Watch';
    this.isRunning = false;
    this.interval = null;
  }

  start(db) {
    this.db = db;
    this.isRunning = true;
    console.log('🌙 Night Watch iniciado');
    
    // Verificar a cada 5 minutos se é hora do night mode
    this.interval = setInterval(() => this.checkNightMode(), 5 * 60 * 1000);
    
    // Verificar imediatamente
    this.checkNightMode();
  }

  stop() {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
    console.log('🌙 Night Watch parado');
  }

  checkNightMode() {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 7;
    
    if (isNight && this.db) {
      console.log('🌙 Night mode ativo - hora:', hour);
      this.db.createEvent({
        type: 'night_mode',
        message: 'Night Watch patrol - sistema operacional',
        agent: this.id
      });
      
      // Atualizar status do agente
      this.db.updateAgent(this.id, { status: 'running', last_active: new Date().toISOString() });
    }
  }
}
