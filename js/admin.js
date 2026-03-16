// admin.js
document.addEventListener('DOMContentLoaded', () => {
  // Protege rota
  const session = DB.getSession();
  if (!session || session.role !== 'admin') { window.location.href = 'login-admin.html'; return; }

  let chartInstance = null;

  // =============================================
  //  DASHBOARD
  // =============================================
  function renderDashboard() {
    const s = DB.getDashboardStats();

    // Cards
    const cards = [
      { icon:'🎓', label:'Alunos Cadastrados',     value: s.totalAlunos,     cls:'green'  },
      { icon:'⏳', label:'Aguardando Aprovação',   value: s.aguardandoAprov,  cls:'orange' },
      { icon:'📤', label:'Aguardando Análise',     value: s.aguardando,       cls:'blue'   },
      { icon:'✅', label:'Confirmadas',            value: s.confirmadas,      cls:'teal'   },
      { icon:'🎯', label:'Realizadas',             value: s.realizadas,       cls:'green'  },
      { icon:'❌', label:'Canceladas',             value: s.canceladas,       cls:'red'    },
      { icon:'🚫', label:'Faltas',                 value: s.faltas,           cls:'gray'   },
    ];
    document.getElementById('cards-admin').innerHTML = cards.map(c => `
      <div class="stat-card ${c.cls}">
        <div class="card-icon">${c.icon}</div>
        <div class="card-value">${c.value}</div>
        <div class="card-label">${c.label}</div>
      </div>`).join('');

    // Badge sidebar pendentes
    const bp = document.getElementById('badge-pendentes');
    if (bp) bp.textContent = s.aguardandoAprov > 0 ? s.aguardandoAprov : '';

    // Consultas de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const hojeConsultas = DB.getConsultas().filter(c => c.dataPreferencial === hoje);
    const divHoje = document.getElementById('consultas-hoje');
    if (!hojeConsultas.length) {
      divHoje.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhuma consulta para hoje.</p></div>`;
    } else {
      divHoje.innerHTML = `<table>
        <thead><tr><th>Aluno</th><th>Horário</th><th>Status</th></tr></thead>
        <tbody>${hojeConsultas.map(c => `
          <tr>
            <td>${c.nomeAluno}</td>
            <td>${c.horarioPreferencial}</td>
            <td>${Utils.badgeConsulta(c.statusConsulta)}</td>
          </tr>`).join('')}
        </tbody></table>`;
    }

    // Gráfico
    const ctx = document.getElementById('chart-status')?.getContext('2d');
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aguardando','Confirmadas','Realizadas','Canceladas','Faltas'],
        datasets: [{
          data: [s.aguardando, s.confirmadas, s.realizadas, s.canceladas, s.faltas],
          backgroundColor: ['#F59E0B','#3A86FF','#2D6A4F','#D62828','#7C3AED'],
          borderWidth: 0,
        }]
      },
      options: {
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 14 } } }
      }
    });
  }

  // =============================================
  //  CONSULTAS
  // =============================================
  window.renderConsultas = function() {
    const texto  = (document.getElementById('filtro-cons-texto')?.value || '').toLowerCase();
    const status = document.getElementById('filtro-cons-status')?.value || '';
    let consultas = DB.getConsultas().reverse();
    if (texto)  consultas = consultas.filter(c => c.nomeAluno?.toLowerCase().includes(texto) || c.motivo.toLowerCase().includes(texto));
    if (status) consultas = consultas.filter(c => c.statusConsulta === status);

    const el = document.getElementById('tabela-consultas');
    if (!consultas.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhuma consulta encontrada.</p></div>`;
      return;
    }
    el.innerHTML = `<table>
      <thead><tr>
        <th>Aluno</th><th>Data Pref.</th><th>Horário</th><th>Turno</th>
        <th>Motivo</th><th>Status</th><th>Obs.</th><th>Ações</th>
      </tr></thead>
      <tbody>${consultas.map(c => `
        <tr>
          <td><strong>${c.nomeAluno}</strong></td>
          <td>${Utils.formatDate(c.dataPreferencial + 'T00:00:00')}</td>
          <td>${c.horarioPreferencial}</td>
          <td>${c.turno}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.motivo}</td>
          <td>${Utils.badgeConsulta(c.statusConsulta)}</td>
          <td class="obs-cell">${c.observacaoPsicologa || '—'}</td>
          <td>
            <div class="actions-group">
              ${c.statusConsulta === 'aguardando' ? `<button class="btn btn-sm btn-primary" onclick="acaoConsulta('${c.id}','confirmada')">✅ Confirmar</button>` : ''}
              ${['aguardando','confirmada'].includes(c.statusConsulta) ? `<button class="btn btn-sm btn-warning" onclick="acaoConsulta('${c.id}','falta')">🚫 Falta</button>` : ''}
              ${['aguardando','confirmada'].includes(c.statusConsulta) ? `<button class="btn btn-sm btn-danger" onclick="acaoConsulta('${c.id}','cancelada')">❌ Cancelar</button>` : ''}
              ${c.statusConsulta === 'confirmada' ? `<button class="btn btn-sm" style="background:var(--primary);color:#fff;" onclick="acaoConsulta('${c.id}','realizada')">🎯 Realizada</button>` : ''}
              <button class="btn btn-sm btn-outline" onclick="modalObs('${c.id}')">📝 Obs.</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  };

  window.acaoConsulta = function(id, novoStatus) {
    DB.atualizarConsulta(id, { statusConsulta: novoStatus });
    renderConsultas();
    renderDashboard();
  };

  window.modalObs = function(id) {
    const c = DB.getConsultas().find(x => x.id === id);
    document.getElementById('modal-acao-title').textContent = '📝 Observação da Psicóloga';
    document.getElementById('modal-acao-body').innerHTML = `
      <p style="color:var(--text-muted);margin-bottom:14px;">Registre uma observação interna para esta consulta. Visível apenas para o admin.</p>
      <div class="form-group">
        <label class="form-label">Observação</label>
        <textarea class="form-control" id="obs-input" rows="4" placeholder="Ex: aluno chegou atrasado, necessita retorno...">${c.observacaoPsicologa || ''}</textarea>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-primary btn-block" onclick="salvarObs('${id}')">💾 Salvar</button>
        <button class="btn btn-outline btn-block" onclick="fecharModal()">Cancelar</button>
      </div>`;
    document.getElementById('modal-acao').style.display = 'flex';
  };

  window.salvarObs = function(id) {
    const obs = document.getElementById('obs-input').value.trim();
    DB.atualizarConsulta(id, { observacaoPsicologa: obs });
    fecharModal();
    renderConsultas();
  };

  // =============================================
  //  CADASTROS PENDENTES
  // =============================================
  window.renderCadastros = function() {
    const pendentes = DB.getAlunos().filter(a => a.statusCadastro === 'pendente');
    const el = document.getElementById('tabela-cadastros');
    if (!pendentes.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">🎉</div><p>Nenhum cadastro aguardando aprovação.</p></div>`;
      return;
    }
    el.innerHTML = `<table>
      <thead><tr>
        <th>Nome</th><th>Matrícula</th><th>CPF</th><th>Curso</th><th>Turma</th>
        <th>E-mail</th><th>Telefone</th><th>Solicitado em</th><th>Ações</th>
      </tr></thead>
      <tbody>${pendentes.map(a => `
        <tr>
          <td><strong>${a.nome}</strong></td>
          <td>${a.matricula}</td>
          <td>${a.cpf}</td>
          <td>${a.curso}</td>
          <td>${a.turma}</td>
          <td>${a.email}</td>
          <td>${a.telefone}</td>
          <td>${Utils.formatDate(a.dataCadastro)}</td>
          <td>
            <div class="actions-group">
              <button class="btn btn-sm btn-primary" onclick="aprovarAluno('${a.id}')">✅ Aprovar</button>
              <button class="btn btn-sm btn-danger" onclick="rejeitarAluno('${a.id}')">❌ Rejeitar</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  };

  window.aprovarAluno = function(id) {
    const aluno = DB.getAlunoById(id);
    // Senha inicial = CPF apenas números
    const senhaInicial = aluno.cpf.replace(/\D/g, '');
    DB.atualizarAluno(id, { statusCadastro: 'aprovado', senha: senhaInicial });
    renderCadastros();
    renderDashboard();
    alert(`✅ Cadastro aprovado!\nSenha inicial definida: ${senhaInicial}\n(CPF do aluno, apenas números)`);
  };

  window.rejeitarAluno = function(id) {
    if (!confirm('Confirma rejeição deste cadastro?')) return;
    DB.atualizarAluno(id, { statusCadastro: 'rejeitado' });
    renderCadastros();
    renderDashboard();
  };

  // =============================================
  //  TODOS OS ALUNOS
  // =============================================
  window.renderAlunos = function() {
    const texto = (document.getElementById('filtro-aluno-texto')?.value || '').toLowerCase();
    let alunos = DB.getAlunos();
    if (texto) alunos = alunos.filter(a => a.nome.toLowerCase().includes(texto) || a.matricula.includes(texto));
    const el = document.getElementById('tabela-alunos');
    if (!alunos.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhum aluno encontrado.</p></div>`;
      return;
    }
    el.innerHTML = `<table>
      <thead><tr>
        <th>Nome</th><th>Matrícula</th><th>Curso</th><th>Turma</th>
        <th>E-mail</th><th>Status Cadastro</th><th>Consultas</th>
      </tr></thead>
      <tbody>${alunos.map(a => {
        const total = DB.getConsultasByAluno(a.id).length;
        return `<tr>
          <td><strong>${a.nome}</strong></td>
          <td>${a.matricula}</td>
          <td>${a.curso}</td>
          <td>${a.turma}</td>
          <td>${a.email}</td>
          <td>${Utils.badgeCadastro(a.statusCadastro)}</td>
          <td>${total}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`;
  };

  // =============================================
  //  MODAL HELPER
  // =============================================
  window.fecharModal = function() {
    document.getElementById('modal-acao').style.display = 'none';
  };

  // =============================================
  //  INIT
  // =============================================
  renderDashboard();
});
