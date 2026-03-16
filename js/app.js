// =============================================
//  app.js — Bootstrap geral da aplicação
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa toggle mobile sidebar
  Utils.initSidebarToggle();

  // Botão de logout (se existir na página)
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      DB.clearSession();
      window.location.href = 'index.html';
    });
  }
});
