// Saudação dinâmica conforme o horário. Existia duplicada em
// DashboardCliente.jsx e Modulos/Dashboard/Dashboard.jsx — centralizada
// aqui pra não ter uma terceira cópia com os mesmos limiares.
export const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};
