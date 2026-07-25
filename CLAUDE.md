Objetivo

Este projeto é um CRM SaaS chamado Prancheto.ia.
Toda implementação deve parecer nativa do sistema, mantendo consistência visual, arquitetural e de experiência do usuário.
Fluxo de trabalho
Antes de iniciar qualquer tarefa:
•	Analise a estrutura atual do projeto.
•	Identifique os padrões utilizados.
•	Reutilize componentes existentes sempre que possível.
•	Compreenda o fluxo antes de modificar qualquer código.
•	Nunca implemente soluções isoladas sem considerar o restante do sistema.

Arquitetura
Sempre:
•	Respeite a arquitetura existente.
•	Evite criar novas abstrações sem necessidade.
•	Utilize componentes, hooks, services e utilitários já existentes.
•	Evite duplicação de código (DRY).
•	Prefira composição ao invés de repetição.
•	Mantenha baixo acoplamento.
•	Escreva código fácil de manter.

Qualidade de Código

Todo código deve:
•	Ser limpo e legível.
•	Ter nomes claros.
•	Seguir as convenções do projeto.
•	Manter tipagem consistente.
•	Remover código morto.
•	Evitar complexidade desnecessária.
•	Evitar comentários desnecessários quando o código puder ser autoexplicativo.

Interface

Toda interface deve:
•	Seguir exatamente o Design System existente.
•	Ser moderna.
•	Ser intuitiva.
•	Ser responsiva.
•	Ter boa acessibilidade.
•	Utilizar os componentes já existentes.
•	Manter consistência de cores, espaçamentos, bordas e tipografia.

Referências de qualidade:

•	Linear
•	Notion
•	Stripe Dashboard
•	GitHub
•	Vercel Dashboard
A inspiração deve ser apenas visual. Nunca copiar layouts literalmente.

Experiência do Usuário
Sempre priorizar:

•	Simplicidade.
•	Clareza.
•	Poucos cliques.
•	Feedback visual.
•	Estados de carregamento.
•	Estados vazios.
•	Tratamento de erros.
•	Mensagens amigáveis.
Toda funcionalidade deve parecer profissional e pronta para produção.

Performance
Sempre que possível:

•	Evitar renders desnecessários.
•	Reutilizar componentes.
•	Fazer lazy loading quando fizer sentido.
•	Evitar consultas repetidas.
•	Evitar processamento desnecessário.
Não otimizar prematuramente, mas evitar desperdícios.

Banco de Dados
Sempre:

•	Respeitar o padrão atual.
•	Criar migrations organizadas.
•	Nomear tabelas de forma consistente.
•	Criar índices quando necessário.
•	Evitar consultas desnecessárias.

Segurança
Sempre considerar:

•	Validação de entradas.
•	Sanitização de dados.
•	Controle de permissões.
•	Não expor informações sensíveis.
•	Validar autenticação antes de operações protegidas.

Antes de finalizar
Sempre:

•	Revisar todo o código criado.
•	Corrigir erros encontrados.
•	Verificar erros de compilação.
•	Garantir que nenhuma funcionalidade existente foi quebrada.
•	Garantir integração com o restante do sistema.
•	Remover imports não utilizados.
•	Remover código temporário.
•	Entregar código pronto para produção.
Nunca finalizar uma tarefa enquanto existirem erros relacionados à implementação realizada.
