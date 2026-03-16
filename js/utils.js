// =============================================
//  utils.js — Funções utilitárias
// =============================================

const Utils = {
  // Formata data ISO para dd/mm/aaaa
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  },

  // Formata data ISO para dd/mm/aaaa hh:mm
  formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  // Extrai só o dia (01-31) de uma data ISO
  formatDay(iso) {
    if (!iso) return '—';
    return new Date(iso).getDate().toString().padStart(2, '0');
  },

  // Extrai mês abreviado (jan, fev…)
  formatMonth(iso) {
    if (!iso) return '';
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return meses[new Date(iso).getMonth()];
  },

  // Retorna badge HTML para status de consulta
  badgeConsulta(status) {
    const map = {
      aguardando: ['badge-aguardando', '⏳', 'Aguardando Análise'],
      confirmada:  ['badge-confirmada',  '✅', 'Confirmada'],
      realizada:   ['badge-realizada',   '🎯', 'Realizada'],
      cancelada:   ['badge-cancelada',   '❌', 'Cancelada'],
      falta:       ['badge-falta',       '🚫', 'Não Compareceu'],
    };
    const [cls, icon, label] = map[status] || ['badge-aguardando', '?', status];
    return `<span class="badge ${cls}">${icon} ${label}</span>`;
  },

  // Retorna badge HTML para status de cadastro
  badgeCadastro(status) {
    const map = {
      pendente:  ['badge-pendente',  '⏳', 'Aguardando Aprovação'],
      aprovado:  ['badge-aprovado',  '✅', 'Aprovado'],
      rejeitado: ['badge-rejeitado', '❌', 'Rejeitado'],
    };
    const [cls, icon, label] = map[status] || ['badge-pendente', '?', status];
    return `<span class="badge ${cls}">${icon} ${label}</span>`;
  },

  // Exibe alerta temporário no container #alert-box
  showAlert(message, type = 'success', containerId = 'alert-box') {
    const box = document.getElementById(containerId);
    if (!box) return;
    const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
    box.innerHTML = `
      <div class="alert alert-${type}">
        <span>${icons[type]}</span>
        <span>${message}</span>
      </div>`;
    setTimeout(() => { if (box) box.innerHTML = ''; }, 4000);
  },

  // Limpa e exibe mensagem no elemento
  setMsg(id, msg, type = 'success') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  },

  // Redireciona com pequeno delay
  redirect(url, delay = 800) {
    setTimeout(() => { window.location.href = url; }, delay);
  },

  // Guarda e recupera estado de tela ativa em painéis
  setActive(nav, section) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.panel-section').forEach(s => s.style.display = 'none');
    if (nav) nav.classList.add('active');
    const sec = document.getElementById(section);
    if (sec) sec.style.display = 'block';
  },

  // Protege rota — redireciona se não houver sessão do tipo esperado
  protectRoute(requiredRole) {
    const session = DB.getSession();
    if (!session) { window.location.href = 'index.html'; return null; }
    if (requiredRole && session.role !== requiredRole) {
      window.location.href = requiredRole === 'admin' ? 'painel-admin.html' : 'painel-aluno.html';
      return null;
    }
    return session;
  },

  // Inicializa sidebar mobile toggle
  initSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  }
};
