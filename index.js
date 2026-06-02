import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import path from 'path'; // <-- 1. ADICIONE ESTE IMPORT

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use((req, res, next) => {
  console.log(`[DEBUG] Recebido: ${req.method} ${req.path}`);
  next();
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: Variáveis de ambiente não encontradas!");
  console.error("Verifique se o arquivo .env existe e está correto.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase conectado com sucesso!");

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  });
});

// BUSCAR DADOS DO PERFIL DO USUÁRIO
app.get('/api/perfil/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('usuario_id', usuario_id)
    .single(); // .single() garante que venha apenas um registro

  if (error) {
    // Se não encontrar, retorna erro vazio para não quebrar o front
    return res.status(404).json({ error: 'Perfil não encontrado' });
  }
  return res.json(data);
});

// SALVAR OU ATUALIZAR PERFIL DO USUÁRIO (UPSERT)
app.post('/api/perfil', async (req, res) => {
  const { usuario_id, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, email } = req.body;

  const { data, error } = await supabase
    .from('perfis')
    .upsert({ 
      usuario_id, 
      nome_empresa, 
      telefone_empresa, 
      endereco_empresa, 
      cnpj_empresa, 
      foto_url,
      email // Certifique-se de salvar esta coluna também
    });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Dados salvos com sucesso!' });
});

// Rota para entregar a página do painel no navegador
app.get('/painel', (req, res) => {
  res.sendFile(path.resolve('painel.html'));
});

app.get('/', (req, res) => res.sendFile(path.resolve('index.html')));

app.get('/api/orcamentos/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// Rota para servir a página
app.get('/orcamentos', (req, res) => {
  res.sendFile(path.resolve('orcamentos.html'));
});

// --- ROTA DE CRIAÇÃO ---
app.post('/orcamentos', async (req, res) => {
  try {
    // Note que removemos o "consultor" daqui, pois virá do perfil do Supabase
    const { usuario_id, cliente_nome, cliente_whatsapp, total, itens } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'ID do usuário não enviado.' });
    }

    // 1. BUSCA O PERFIL DO EMISSOR NO SUPABASE
    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('nome_empresa')
      .eq('usuario_id', usuario_id)
      .single();

    // Se não achar o perfil ou der erro, define um nome padrão para não travar o envio
    const nomeEmissor = (!erroPerfil && perfil) ? perfil.nome_empresa : 'Consultor';

    // 2. INSERE O ORÇAMENTO COM O NOME DO EMISSOR RECENTEMENTE BUSCADO
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([{ 
        usuario_id, 
        cliente_nome, 
        cliente_whatsapp, 
        total, 
        itens, 
        consultor: nomeEmissor, // Salva o nome da empresa/emissor do perfil aqui
        status: 'pendente' 
      }])
      .select();

    if (error) {
      console.error("❌ Erro retornado pelo Supabase:", error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado retornado pelo banco.' });
    }

    const idGerado = data[0].id;
    const linkCliente = `https://fsorcamentos.com.br/ver/${idGerado}`;

    return res.status(201).json({ id: idGerado, linkCliente });

  } catch (err) {
    console.error("💥 Erro interno inesperado no servidor:", err);
    return res.status(500).json({ error: 'Erro interno no servidor de orçamentos.' });
  }
});

// --- 2. ADICIONE ESTA ROTA PARA ENTREGAR A PÁGINA V.HTML ---
app.get('/ver/:id', (req, res) => {
  res.sendFile(path.resolve('v.html'));
});


// --- APIS DE BUSCA E ATUALIZAÇÃO ---
app.get('/orcamentos/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  return res.json(data);
});

app.patch('/orcamentos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['aprovado', 'recusado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: `Orçamento ${status} com sucesso!`, data });
});

const PORT = process.env.PORT || 3000;

// Buscar orçamentos PENDENTES
app.get('/admin/orcamentos/pendentes', async (req, res) => {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// Buscar orçamentos APROVADOS
app.get('/admin/orcamentos/aprovados', async (req, res) => {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('status', 'aprovado')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// Buscar orçamentos RECUSADOS
app.get('/admin/orcamentos/recusados', async (req, res) => {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('status', 'recusado')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});



app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});