# Especificação Funcional: Relatórios e Métricas

## 1. Identificação do Módulo
- **Nome:** Relatórios e Painel de Métricas em Tempo Real
- **Componente Principal:** `Relatorios` (`frontend/src/pages/DashboardCliente/Relatorios/Relatorios.jsx`)
- **Subcomponentes:** `CardMetrica`, `BarraProgresso`, `Spinner`
- **Rota:** `/dashboard/relatorios`
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Apresentar uma visão analítica consolidada do desempenho comercial, retenção de clientes (LTV), funil de vendas, ações outbound, compromissos na agenda, temperatura de leads e distribuição por equipes através de consultas agregadas no banco de dados.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase):**
  - `crm_contatos`: total de leads, clientes ativos, estágios de funil, receita fechada, pipeline ativo, score de temperatura, origens e times.
  - `agenda_eventos`: total de compromissos agendados e eventos marcados para o dia de hoje.
  - `outbound_acoes`: total de disparos/ações, pendentes e concluídas.
  - `org_times`: nomes, ícones e cores das equipes para agrupamento de dados.
- **Estados Locais:** `dados` (objeto compilado com todas as métricas), `carregando` (boolean), `erro` (string).

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Atualizar (`🔄`)** | Botão Ação | Recarrega e recalcula todas as consultas SQL em paralelo (`Promise.allSettled`). | Desabilitado durante o carregamento (`carregando === true`). |
| **Card Metrica: Total de Leads** | Card KPI | Exibe a contagem total de contatos com `tipo_registro === 'lead'`. | Ícone `🎯`, destacado em roxo/primário. |
| **Card Metrica: Clientes Ativos** | Card KPI | Exibe a contagem total de contatos convertidos com `tipo_registro === 'cliente'`. | Ícone `🤝`, destacado em verde. |
| **Card Metrica: Negócios Fechados** | Card KPI | Exibe o total de negociações no estágio `status_funil === 'fechado'`. | Ícone `✅`. |
| **Card Metrica: Receita Fechada** | Card KPI | Soma o `valor_estimado` de todas as oportunidades fechadas. | Formatado em moeda BRL (`R$ 0.000,00`). |
| **Card Metrica: Taxa de Conversão** | Card KPI | Percentual de conversão de leads em clientes fechados (`(fechados / totalLeads) * 100`). | Calculado em tempo real. |
| **Card Metrica: LTV Médio** | Card KPI | Média de valor por cliente (`ltvTotal / totalClientes`). | Exibido em BRL. |
| **Card Metrica: Leads Quentes** | Card KPI | Contagem de leads com `score >= 70`. | Ícone `🔥`, cor vermelha. |
| **Card Metrica: Leads Frios** | Card KPI | Contagem de leads com `score < 30`. | Ícone `❄️`, cor neutra. |
| **Painel Funil de Vendas** | Card com Barras de Progresso | Exibe o volume de leads em cada etapa do funil: `Lead`, `Qualificado`, `Proposta`, `Negociação`, `Fechado`, `Perdido`. | Mostra a barra de progresso com porcentagem em relação ao total de leads. |
| **Pipeline Ativo** | Texto de Destaque | Exibe o valor financeiro acumulado das oportunidades em andamento (excluindo fechadas e perdidas). | Renderizado no rodapé do card do funil de vendas. |
| **Painel Outbound & Agenda** | Tabela de Resumo | Lista o total de ações outbound, pendentes, concluídas, total de eventos agendados e eventos de hoje. | Tabela comparativa limpa. |
| **Painel Temperatura dos Leads** | Grid de 3 Blocos | Separação quantitativa em 3 caixas: Quentes (`≥70`), Mornos (`30–69`) e Frios (`<30`). | Cores intuitivas (Vermelho, Amarelo, Cinza). |
| **Tabela de Distribuição por Time** | Tabela de Dados | Exibe a quantidade de leads, clientes e total acumulado agrupados por equipe/departamento da empresa. | Mostra ícone e cor customizada do time (`org_times`). |
| **Tabela de Fontes de Contatos** | Tabela de Dados | Agrupa a origem dos contatos (ex: `site`, `whatsapp`, `indicação`, `manual`) e o percentual representativo sobre o total. | Ordenada do maior volume para o menor. |
| **Estado Vazio Geral** | Card de Informação | Exibido caso o banco ainda não possua nenhum contato, evento ou ação cadastrada. | Alerta para adicionar contatos para gerar gráficos. |
