// =============================================================
// PRANCHETO.IA - CONTROLLER DE TENANTS (Super Admin)
// CRUD completo de tenants (empresas clientes).
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// ----------------------------------------------------------
// HELPER: Registra evento no audit_log (sem lançar exceção)
// ----------------------------------------------------------
const registrarAudit = async (dados) => {
  const { error } = await supabase.from('audit_logs').insert(dados);
  if (error) logger.warn('[Tenants] Falha ao registrar audit_log:', error.message);
};

// =============================================================
// GET /api/admin/tenants
// Lista tenants com filtros e paginação
// =============================================================
const listarTenants = async (req, res, next) => {
  try {
    const {
      pagina  = 1,
      limite  = 20,
      status,
      plano,
      busca,
    } = req.query;

    const paginaNum = parseInt(pagina, 10);
    const limiteNum = parseInt(limite, 10);
    const offset    = (paginaNum - 1) * limiteNum;

    // --- Query de dados ---
    let query = supabase
      .from('tenants')
      .select('id, nome, slug, email_contato, plano, status, limite_usuarios, criado_em, atualizado_em', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limiteNum - 1);

    if (status) query = query.eq('status', status);
    if (plano)  query = query.eq('plano', plano);
    if (busca) {
      // ilike para busca case-insensitive em nome ou slug
      query = query.or(`nome.ilike.%${busca}%,slug.ilike.%${busca}%,email_contato.ilike.%${busca}%`);
    }

    const { data: tenants, error, count } = await query;

    if (error) throw error;

    // Busca contagem de usuários por tenant em paralelo
    const tenantsComUsuarios = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count: qtdUsuarios } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        return { ...tenant, qtd_usuarios: qtdUsuarios || 0 };
      })
    );

    const total = count || 0;

    return res.json({
      tenants: tenantsComUsuarios,
      paginacao: {
        pagina:       paginaNum,
        limite:       limiteNum,
        total,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });
  } catch (erro) {
    logger.error('[Tenants] Erro ao listar tenants:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/admin/tenants
// Cria um novo tenant
// =============================================================
const criarTenant = async (req, res, next) => {
  try {
    const {
      nome,
      slug,
      email_contato,
      plano         = 'starter',
      limite_usuarios = 5,
      configuracoes = {},
    } = req.body;

    if (!nome || !slug) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0301',
        mensagem: 'Nome e slug são obrigatórios.',
      });
    }

    // Verifica se o slug já existe
    const { data: existente } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug.toLowerCase().trim())
      .limit(1);

    if (existente?.length > 0) {
      return res.status(409).json({
        sucesso:  false,
        codigo:   'CRM-0302',
        mensagem: 'Já existe um tenant com este slug.',
      });
    }

    // Cria o tenant
    const { data: novosTenants, error } = await supabase
      .from('tenants')
      .insert({
        nome:            nome.trim(),
        slug:            slug.toLowerCase().trim(),
        email_contato:   email_contato?.trim() || null,
        plano,
        status:          'ativo',
        limite_usuarios,
        configuracoes,
      })
      .select('id, nome, slug, email_contato, plano, status, limite_usuarios, criado_em');

    if (error) throw error;

    const novoTenant = novosTenants?.[0];

    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        'tenant_criado',
      recurso:     'tenants',
      recurso_id:  novoTenant.id,
      descricao:   `Novo tenant criado: ${nome} (${slug})`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    logger.info(`Novo tenant criado: ${nome} (${slug})`, { tenantId: novoTenant.id });

    return res.status(201).json({
      sucesso:  true,
      mensagem: 'Tenant criado com sucesso.',
      tenant:   novoTenant,
    });
  } catch (erro) {
    logger.error('[Tenants] Erro ao criar tenant:', erro.message);
    next(erro);
  }
};

// =============================================================
// GET /api/admin/tenants/:id
// Retorna um tenant específico com contagem de usuários
// =============================================================
const obterTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) throw error;

    const tenant = tenants?.[0];

    if (!tenant) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0303',
        mensagem: 'Tenant não encontrado.',
      });
    }

    // Conta usuários do tenant
    const { count: qtdUsuarios } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id);

    return res.json({
      sucesso: true,
      tenant:  { ...tenant, qtd_usuarios: qtdUsuarios || 0 },
    });
  } catch (erro) {
    logger.error('[Tenants] Erro ao obter tenant:', erro.message);
    next(erro);
  }
};

// =============================================================
// PUT /api/admin/tenants/:id
// Atualiza dados de um tenant
// =============================================================
const atualizarTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email_contato,
      plano,
      limite_usuarios,
      configuracoes,
    } = req.body;

    // Verifica se o tenant existe
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome')
      .eq('id', id)
      .limit(1);

    const tenant = tenants?.[0];

    if (!tenant) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0303',
        mensagem: 'Tenant não encontrado.',
      });
    }

    // Monta objeto de atualização apenas com campos fornecidos
    const atualizacao = { atualizado_em: new Date().toISOString() };
    if (nome            !== undefined) atualizacao.nome            = nome.trim();
    if (email_contato   !== undefined) atualizacao.email_contato   = email_contato?.trim() || null;
    if (plano           !== undefined) atualizacao.plano           = plano;
    if (limite_usuarios !== undefined) atualizacao.limite_usuarios = limite_usuarios;
    if (configuracoes   !== undefined) atualizacao.configuracoes   = configuracoes;

    const { data: atualizados, error } = await supabase
      .from('tenants')
      .update(atualizacao)
      .eq('id', id)
      .select('id, nome, slug, email_contato, plano, status, limite_usuarios, atualizado_em');

    if (error) throw error;

    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        'tenant_atualizado',
      recurso:     'tenants',
      recurso_id:  id,
      descricao:   `Tenant atualizado: ${tenant.nome}`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    return res.json({
      sucesso:  true,
      mensagem: 'Tenant atualizado com sucesso.',
      tenant:   atualizados?.[0],
    });
  } catch (erro) {
    logger.error('[Tenants] Erro ao atualizar tenant:', erro.message);
    next(erro);
  }
};

// =============================================================
// PATCH /api/admin/tenants/:id/status
// Altera o status de um tenant (ativo/suspenso/cancelado)
// =============================================================
const alterarStatusTenant = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const statusValidos = ['ativo', 'suspenso', 'cancelado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0304',
        mensagem: `Status inválido. Use: ${statusValidos.join(', ')}.`,
      });
    }

    // Verifica se o tenant existe
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome, status')
      .eq('id', id)
      .limit(1);

    const tenant = tenants?.[0];

    if (!tenant) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0303',
        mensagem: 'Tenant não encontrado.',
      });
    }

    const atualizacao = {
      status,
      atualizado_em: new Date().toISOString(),
      suspenso_em:   status === 'suspenso' ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('tenants')
      .update(atualizacao)
      .eq('id', id);

    if (error) throw error;

    logger.info(`Status do tenant alterado: ${tenant.nome} → ${status}`, { tenantId: id });

    return res.json({
      sucesso:  true,
      mensagem: `Status do tenant alterado para "${status}" com sucesso.`,
    });
  } catch (erro) {
    logger.error('[Tenants] Erro ao alterar status do tenant:', erro.message);
    next(erro);
  }
};

module.exports = {
  listarTenants,
  criarTenant,
  obterTenant,
  atualizarTenant,
  alterarStatusTenant,
};
