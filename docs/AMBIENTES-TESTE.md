# Guia de teste — Prancheto.IA

Documento para quem vai **testar** o sistema. Traz os endereços, as contas e o
que esperar de cada ambiente.

> Procurando detalhes de infraestrutura — migrations, variáveis, deploy?
> Estão em [AMBIENTES.md](AMBIENTES.md). Aqui é o essencial para usar.

---

## Os dois ambientes

| | Desenvolvimento | Produção |
|---|---|---|
| **Endereço** | https://prancheto-dev.vercel.app | https://prancheto-prod.vercel.app |
| **Para que serve** | Testar à vontade | Uso real dos clientes |
| **Dados** | Fictícios e descartáveis | Reais |
| **Como aparece no app** | `Prancheto.IA [DEV]` | `Prancheto.IA` |

O rótulo `[DEV]` aparece na barra lateral, na tela de login e no título da aba
do navegador. Se ele não estiver lá, você está em produção.

Produção também responde em https://prancheto-ia.vercel.app — mesmo sistema,
endereço antigo mantido.

**Teste sempre em desenvolvimento.** Os dois bancos são fisicamente separados:
nada do que você fizer em `prancheto-dev` alcança cliente nenhum.

---

## Contas para teste

Válidas **apenas** em https://prancheto-dev.vercel.app. Não existem em produção.

| E-mail | Senha | Cargo | O que enxerga |
|---|---|---|---|
| `admin@acme.dev` | `prancheto-dev-2026` | Líder Geral | Tudo: Organização, Cargos, Times, Identidade Visual |
| `gerente@acme.dev` | `prancheto-dev-2026` | Líder de Time | Gerencia seu time; sem exclusões |
| `membro@acme.dev` | `prancheto-dev-2026` | Membro de Time | Visualiza e cria; não gerencia |

### Teste com mais de uma conta

Boa parte do sistema muda conforme o cargo — botões somem, telas ficam
indisponíveis, o assistente oferece menos ações. Testar só com `admin` esconde
justamente os problemas de permissão, que são os mais difíceis de achar depois.

Um roteiro que cobre bem: faça a mesma tarefa como `admin@acme.dev` e como
`membro@acme.dev`, e compare o que cada um consegue.

---

## O que já está no ar para testar

- **CRM** — leads, clientes, funil em Kanban, interações, campos customizados
- **Organização** — times, cargos e permissões, identidade visual da empresa
- **Configurações** — perfil (nome e telefone), aparência, notificações, plano
- **Agenda, Relatórios, Outbound, Suporte, Chat interno**
- **Assistente de IA** — ver a limitação abaixo

---

## Limitação conhecida: o assistente de IA

O Chat com IA responde **"Assistente indisponível no momento"**. Isso é
esperado: falta crédito na conta da OpenAI. Não é defeito, e não adianta tentar
de novo — a faixa amarela explica o motivo na própria tela.

Todo o resto do sistema funciona normalmente.

Quando houver crédito, o assistente passa a consultar e agir no CRM: buscar
contatos, resumir o funil, criar lead, registrar interação e — mediante
confirmação sua em um cartão na conversa — atualizar contato, mover no funil e
converter em cliente.

**Para ver o cartão de confirmação antes disso:** entre como `admin@acme.dev`,
abra Chat com IA e clique na conversa "Demonstracao: cartao de confirmacao" na
lista lateral. O botão Confirmar executa de verdade no CRM de desenvolvimento.

---

## Antes de reportar um problema

Vale conferir três coisas, que respondem pela maioria dos falsos alarmes:

1. **Você está em dev?** Confira o `[DEV]` no nome. Em produção o comportamento
   é o mesmo, mas os dados são reais.
2. **Qual conta?** O cargo muda o que aparece na tela. Um botão ausente pode ser
   permissão, e não bug.
3. **Recarregue com Ctrl+Shift+R.** O navegador guarda versões antigas do sistema
   e isso explica boa parte do "sumiu" e do "voltou o erro antigo".

Ao relatar, diga o **endereço**, a **conta** usada, o que você **esperava** e o
que **aconteceu**. Print ajuda.

---

## Cuidados

- **O ambiente de desenvolvimento é público.** Qualquer pessoa com o link chega
  na tela de login. Não coloque nada confidencial lá — nem dado real de cliente,
  nem informação que não possa vazar.
- **As senhas acima são de teste**, de um ambiente descartável. Ainda assim,
  compartilhe este documento apenas com quem vai testar.
- **Não teste em produção.** Se precisar validar algo com dado real, fale com o
  responsável antes.
