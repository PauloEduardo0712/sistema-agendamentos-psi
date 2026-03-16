// aluno.js
document.addEventListener('DOMContentLoaded', () => {
  const session = DB.getSession();

  // =============================================
  //  AGENDAMENTO.HTML
  // =============================================
  const formAg = document.getElementById('form-agendamento');
  if (formAg) {
    // Protege rota
    if (!session || session.role !== 'aluno') { window.location.href = 'login-aluno.html'; return; }

    // Mínimo: hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataPreferencial').min = hoje;

    formAg.addEventListener('submit', (e) => {
      e.preventDefault();
      const motivo            = document.getElementById('motivo').value.trim();
      const dataPreferencial  = document.getElementById('dataPreferencial').value;
      const horarioPreferencial = document.getElementById('horarioPreferencial').value;
      const turno             = document.getElementById('turno').value;
      const observacaoAluno   = document.getElementById('observacaoAluno').value.trim();

      if (!motivo || !dataPreferencial || !horarioPreferencial || !turno) {
        Utils.showAlert('Preencha todos os campos obrigatórios.', 'danger');
        return;
      }

      // Verifica conflito de horário (regra de negócio)
      const consultas = DB.getConsultas();
      const conflito = consultas.find(c =>
        c.dataPreferencial === dataPreferencial &&
        c.horarioPreferencial === horarioPreferencial &&
        ['aguardando','confirmada'].includes(c.statusConsulta)
      );
      if (conflito) {
        Utils.showAlert('⚠️ Este horário já possui uma solicitação pendente ou confirmada. Escolha outro horário.', 'warning');
        return;
      }

      DB.adicionarConsulta({
        idAluno: session.id,
        nomeAluno: session.nome,
        motivo, dataPreferencial, horarioPreferencial, turno, observacaoAluno
      });

      Utils.showAlert('✅ Agendamento solicitado com sucesso! Aguarde confirmação.', 'success');
      formAg.reset();
      setTimeout(() => { window.location.href = 'painel-aluno.html'; }, 2000);
    });
    return;
  }

  // =============================================
  //  PAINEL-ALUNO.HTML
  // =============================================
  const welcomeMsg = document.getElementById('welcome-msg');
  if (!welcomeMsg) return;

  // Protege rota
  if (!session || session.role !== 'aluno') { window.location.href = 'login-aluno.html'; return; }

  const aluno = DB.getAlunoById(session.id);

  // Sidebar
  document.getElementById('sidebar-nome').textContent = session.nome.split(' ')[0];
  document.getElementById('avatar-initials').textContent = session.nome[0].toUpperCase();
  welcomeMsg.textContent = 'Olá, ' + session.nome.split(' ')[0] + '!';

  // Cards
  function renderCards() {
    const consultas = DB.getConsultasByAluno(session.id);
    const stats = [
      { icon:'📤', label:'Solicitadas',  value: consultas.length,                                          cls:'teal'   },
      { icon:'✅', label:'Confirmadas',  value: consultas.filter(c=>c.statusConsulta==='confirmada').length, cls:'blue'   },
      { icon:'🎯', label:'Realizadas',   value: consultas.filter(c=>c.statusConsulta==='realizada').length,  cls:'green'  },
      { icon:'❌', label:'Canceladas',   value: consultas.filter(c=>c.statusConsulta==='cancelada').length,  cls:'red'    },
      { icon:'🚫', label:'Faltas',       value: consultas.filter(c=>c.statusConsulta==='falta').length,      cls:'gray'   },
    ];
    document.getElementById('cards-aluno').innerHTML = stats.map(s => `
      <div class="stat-card ${s.cls}">
        <div class="card-icon">${s.icon}</div>
        <div class="card-value">${s.value}</div>
        <div class="card-label">${s.label}</div>
      </div>`).join('');
  }

  // Tabela recentes
  function renderRecentes() {
    const consultas = DB.getConsultasByAluno(session.id).slice(-5).reverse();
    const el = document.getElementById('tabela-recentes');
    if (!consultas.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhuma consulta solicitada ainda.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Data Pref.</th>
            <th>Horário</th>
            <th>Turno</th>
            <th>Motivo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${consultas.map(c => `
            <tr>
              <td>${Utils.formatDate(c.dataPreferencial + 'T00:00:00')}</td>
              <td>${c.horarioPreferencial}</td>
              <td>${c.turno}</td>
              <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.motivo}</td>
              <td>${Utils.badgeConsulta(c.statusConsulta)}</td>
              <td>
                ${['aguardando','confirmada'].includes(c.statusConsulta)
                  ? `<button class="btn btn-sm btn-danger" onclick="abrirModalCancelar('${c.id}')">Cancelar</button>`
                  : '—'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  // Histórico completo
  window.renderHistorico = function() {
    const texto  = (document.getElementById('filtro-texto')?.value || '').toLowerCase();
    const status = document.getElementById('filtro-status')?.value || '';
    let consultas = DB.getConsultasByAluno(session.id);
    if (texto)  consultas = consultas.filter(c => c.motivo.toLowerCase().includes(texto));
    if (status) consultas = consultas.filter(c => c.statusConsulta === status);
    consultas = consultas.reverse();

    const el = document.getElementById('lista-historico');
    if (!consultas.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhuma consulta encontrada.</p></div>`;
      return;
    }
    el.innerHTML = consultas.map(c => `
      <div class="consulta-item">
        <div class="consulta-date">
          <div class="day">${Utils.formatDay(c.dataPreferencial + 'T00:00:00')}</div>
          <div class="month">${Utils.formatMonth(c.dataPreferencial + 'T00:00:00')}</div>
        </div>
        <div class="consulta-info">
          <h4>${c.motivo}</h4>
          <p>🕐 ${c.horarioPreferencial} &nbsp;|&nbsp; ${c.turno} &nbsp;|&nbsp; Solicitado em ${Utils.formatDate(c.dataCriacao)}</p>
          ${c.observacaoAluno ? `<p style="margin-top:4px;font-style:italic;">💬 ${c.observacaoAluno}</p>` : ''}
        </div>
        <div>
          ${Utils.badgeConsulta(c.statusConsulta)}
          ${['aguardando','confirmada'].includes(c.statusConsulta)
            ? `<br><button class="btn btn-sm btn-danger" style="margin-top:8px;" onclick="abrirModalCancelar('${c.id}')">Cancelar</button>`
            : ''}
        </div>
      </div>`).join('');
  };

  // Modal cancelar
  let cancelId = null;
  window.abrirModalCancelar = function(id) {
    cancelId = id;
    document.getElementById('modal-cancelar').style.display = 'flex';
  };
  document.getElementById('btn-confirma-cancel')?.addEventListener('click', () => {
    if (!cancelId) return;
    DB.atualizarConsulta(cancelId, { statusConsulta: 'cancelada' });
    document.getElementById('modal-cancelar').style.display = 'none';
    cancelId = null;
    renderCards(); renderRecentes(); renderHistorico();
  });

  // Init
  renderCards();
  renderRecentes();
  renderHistorico();
});
