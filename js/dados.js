// =============================================
//  dados.js — Camada de dados (localStorage)
// =============================================

const DB = {
  // ---- Inicialização ----
  init() {
    if (!localStorage.getItem('alunos')) {
      // Admin padrão já existe; alunos inicia vazio
      localStorage.setItem('alunos', JSON.stringify([]));
    }
    if (!localStorage.getItem('consultas')) {
      localStorage.setItem('consultas', JSON.stringify([]));
    }
    if (!localStorage.getItem('admin')) {
      localStorage.setItem('admin', JSON.stringify({
        usuario: 'admin',
        senha: 'admin123',
        nome: 'Dra. Psicóloga',
        role: 'admin'
      }));
    }
  },

  // ---- Alunos ----
  getAlunos() {
    return JSON.parse(localStorage.getItem('alunos') || '[]');
  },
  saveAlunos(arr) {
    localStorage.setItem('alunos', JSON.stringify(arr));
  },
  getAlunoById(id) {
    return this.getAlunos().find(a => a.id === id) || null;
  },
  getAlunoByMatricula(matricula) {
    return this.getAlunos().find(a => a.matricula === matricula) || null;
  },
  adicionarAluno(dados) {
    const alunos = this.getAlunos();
    const novo = {
      id: 'aluno_' + Date.now(),
      ...dados,
      senha: null,
      statusCadastro: 'pendente',
      dataCadastro: new Date().toISOString()
    };
    alunos.push(novo);
    this.saveAlunos(alunos);
    return novo;
  },
  atualizarAluno(id, updates) {
    const alunos = this.getAlunos().map(a => a.id === id ? { ...a, ...updates } : a);
    this.saveAlunos(alunos);
  },

  // ---- Consultas ----
  getConsultas() {
    return JSON.parse(localStorage.getItem('consultas') || '[]');
  },
  saveConsultas(arr) {
    localStorage.setItem('consultas', JSON.stringify(arr));
  },
  getConsultasByAluno(idAluno) {
    return this.getConsultas().filter(c => c.idAluno === idAluno);
  },
  adicionarConsulta(dados) {
    const consultas = this.getConsultas();
    const nova = {
      id: 'cons_' + Date.now(),
      ...dados,
      statusConsulta: 'aguardando',
      observacaoPsicologa: '',
      dataCriacao: new Date().toISOString()
    };
    consultas.push(nova);
    this.saveConsultas(consultas);
    return nova;
  },
  atualizarConsulta(id, updates) {
    const consultas = this.getConsultas().map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveConsultas(consultas);
  },
  removerConsulta(id) {
    const consultas = this.getConsultas().filter(c => c.id !== id);
    this.saveConsultas(consultas);
  },

  // ---- Admin ----
  getAdmin() {
    return JSON.parse(localStorage.getItem('admin'));
  },

  // ---- Sessão ----
  setSession(user) {
    sessionStorage.setItem('session', JSON.stringify(user));
  },
  getSession() {
    return JSON.parse(sessionStorage.getItem('session') || 'null');
  },
  clearSession() {
    sessionStorage.removeItem('session');
  },

  // ---- Dashboard stats ----
  getDashboardStats() {
    const alunos = this.getAlunos();
    const consultas = this.getConsultas();
    return {
      totalAlunos:      alunos.filter(a => a.statusCadastro === 'aprovado').length,
      aguardandoAprov:  alunos.filter(a => a.statusCadastro === 'pendente').length,
      aguardando:       consultas.filter(c => c.statusConsulta === 'aguardando').length,
      confirmadas:      consultas.filter(c => c.statusConsulta === 'confirmada').length,
      realizadas:       consultas.filter(c => c.statusConsulta === 'realizada').length,
      canceladas:       consultas.filter(c => c.statusConsulta === 'cancelada').length,
      faltas:           consultas.filter(c => c.statusConsulta === 'falta').length,
    };
  }
};

DB.init();
