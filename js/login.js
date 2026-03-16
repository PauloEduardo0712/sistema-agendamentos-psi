// login.js
document.addEventListener('DOMContentLoaded', () => {
  // ---------- LOGIN ALUNO ----------
  const formAluno = document.getElementById('form-login');
  if (formAluno) {
    formAluno.addEventListener('submit', (e) => {
      e.preventDefault();
      const matricula = document.getElementById('matricula').value.trim();
      const senha     = document.getElementById('senha').value.trim();

      const aluno = DB.getAlunoByMatricula(matricula);

      if (!aluno) {
        Utils.showAlert('Matrícula não encontrada. Verifique ou crie seu cadastro.', 'danger');
        return;
      }
      if (aluno.statusCadastro === 'pendente') {
        Utils.showAlert('Seu cadastro ainda está aguardando aprovação da psicóloga. Tente novamente em até 24 horas.', 'warning');
        return;
      }
      if (aluno.statusCadastro === 'rejeitado') {
        Utils.showAlert('Seu cadastro foi recusado. Entre em contato com a psicóloga.', 'danger');
        return;
      }
      if (aluno.senha !== senha) {
        Utils.showAlert('Senha incorreta. A senha inicial é o seu CPF (apenas números).', 'danger');
        return;
      }

      DB.setSession({ id: aluno.id, nome: aluno.nome, role: 'aluno', matricula: aluno.matricula });
      Utils.showAlert('Login realizado! Redirecionando...', 'success');
      Utils.redirect('painel-aluno.html');
    });
  }

  // ---------- LOGIN ADMIN ----------
  const formAdmin = document.getElementById('form-login-admin');
  if (formAdmin) {
    formAdmin.addEventListener('submit', (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const senha   = document.getElementById('senha').value.trim();
      const admin   = DB.getAdmin();

      if (usuario !== admin.usuario || senha !== admin.senha) {
        Utils.showAlert('Usuário ou senha incorretos.', 'danger');
        return;
      }
      DB.setSession({ id: 'admin', nome: admin.nome, role: 'admin' });
      Utils.showAlert('Login realizado! Redirecionando...', 'success');
      Utils.redirect('painel-admin.html');
    });
  }
});
