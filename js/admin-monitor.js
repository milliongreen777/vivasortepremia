// admin-monitor.js
// Script adicional para monitoramento avançado

class AdminMonitor {
    constructor() {
        this.lastData = null;
        this.consultas = [];
        this.init();
    }
    
    init() {
        console.log('🔧 Admin Monitor inicializado');
        this.loadConsultas();
        this.startMonitoring();
    }
    
    loadConsultas() {
        try {
            const saved = localStorage.getItem('adminConsultas');
            this.consultas = saved ? JSON.parse(saved) : [];
            console.log(`📊 ${this.consultas.length} consultas carregadas`);
        } catch (error) {
            console.error('❌ Erro ao carregar consultas:', error);
            this.consultas = [];
        }
    }
    
    startMonitoring() {
        // Monitorar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminData') {
                this.handleNewData(e.newValue);
            }
        });
        
        // Verificar periodicamente
        setInterval(() => this.checkForUpdates(), 2000);
    }
    
    checkForUpdates() {
        const currentData = localStorage.getItem('adminData');
        if (currentData !== this.lastData) {
            this.handleNewData(currentData);
        }
    }
    
    handleNewData(dataString) {
        try {
            if (!dataString || dataString === '{}') return;
            
            const data = JSON.parse(dataString);
            this.lastData = dataString;
            
            // Adicionar à lista de consultas
            if (data.cpf && data.cpf !== 'undefined') {
                const consulta = {
                    ...data,
                    id: Date.now(),
                    receivedAt: new Date().toISOString()
                };
                
                this.consultas.unshift(consulta);
                
                // Limitar a 100 consultas
                if (this.consultas.length > 100) {
                    this.consultas.pop();
                }
                
                // Salvar
                localStorage.setItem('adminConsultas', JSON.stringify(this.consultas));
                
                console.log('🎯 Nova consulta capturada:', {
                    cpf: data.cpf,
                    nome: data.nome,
                    timestamp: new Date().toLocaleString()
                });
                
                // Notificar (se em página admin)
                if (typeof window.notifyNewData === 'function') {
                    window.notifyNewData(consulta);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar novos dados:', error);
        }
    }
    
    getStats() {
        return {
            totalConsultas: this.consultas.length,
            withTelefone: this.consultas.filter(c => c.telefone && c.telefone !== 'Aguardando...').length,
            lastConsulta: this.consultas[0] || null
        };
    }
    
    exportData(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.consultas, null, 2);
        } else if (format === 'csv') {
            return this.toCSV();
        }
        return '';
    }
    
    toCSV() {
        if (this.consultas.length === 0) return '';
        
        const headers = ['CPF', 'Nome', 'Nascimento', 'Idade', 'Telefone', 'Data Consulta'];
        const rows = this.consultas.map(consulta => [
            consulta.cpf,
            consulta.nome,
            consulta.nascimento,
            consulta.idade,
            consulta.telefone,
            consulta.dataConsulta
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }
}

// Inicializar automaticamente se estiver na página admin
if (window.location.pathname.includes('admin')) {
    window.adminMonitor = new AdminMonitor();
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AdminMonitor = AdminMonitor;
}