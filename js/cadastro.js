// cadastro.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cadastro');

  // Máscara CPF
  const cpfInput = document.getElementById('cpf');
  cpfInput.addEventListener('input', () => {
    let v = cpfInput.value.replace(/\D/g,'').slice(0,11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/,'$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/,'$1.$2');
    cpfInput.value = v;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome      = document.getElementById('nome').value.trim();
    const matricula = document.getElementById('matricula').value.trim();
    const cpf       = document.getElementById('cpf').value.trim();
    const telefone  = document.getElementById('telefone').value.trim();
    const curso     = document.getElementById('curso').value.trim();
    const turma     = document.getElementById('turma').value.trim();
    const email     = document.getElementById('email').value.trim();

    if (!nome || !matricula || !cpf || !telefone || !curso || !turma || !email) {
      Utils.showAlert('Preencha todos os campos obrigatórios.', 'danger');
      return;
    }

    // Verifica matrícula duplicada
    if (DB.getAlunoByMatricula(matricula)) {
      Utils.showAlert('Já existe um cadastro com essa matrícula.', 'warning');
      return;
    }

    DB.adicionarAluno({ nome, matricula, cpf, telefone, curso, turma, email });

    Utils.showAlert('✅ Cadastro enviado com sucesso! Aguarde aprovação em até 24 horas.', 'success');
    form.reset();
    document.getElementById('btn-submit').disabled = true;
    setTimeout(() => { window.location.href = 'login-aluno.html'; }, 3000);
  });
});
