// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
    const formPerfil = document.getElementById('form-cadastro-perfil');

    if (formPerfil) {
        await carregarPerfil();
        configurarUploadLogo();
        configurarModalSenha();
    }

    const listaPainel = document.getElementById('lista-painel');

    if (listaPainel) {
        carregarOrcamentos();
    }
});

// ==================== HELPERS ====================

function pegarElemento(id) {
    return document.getElementById(id);
}

function setValor(id, valor) {
    const el = pegarElemento(id);
    if (el) el.value = valor || '';
}

function getValor(id) {
    const el = pegarElemento(id);
    return el ? el.value.trim() : '';
}

function mostrarPreviewLogo(url) {
    const preview = pegarElemento('preview-logo');
    const previewVazio = pegarElemento('logo-preview-empty');
    const logoAtual = pegarElemento('logo-atual');

    if (preview && url) {
        preview.src = url + '?v=' + Date.now();
        preview.style.display = 'block';
    }

    if (logoAtual && url) {
        logoAtual.src = url + '?v=' + Date.now();
        logoAtual.style.display = 'block';
    }

    if (previewVazio) {
        previewVazio.style.display = url ? 'none' : 'flex';
    }
}

function limparPreviewLogo() {
    const preview = pegarElemento('preview-logo');
    const previewVazio = pegarElemento('logo-preview-empty');
    const logoAtual = pegarElemento('logo-atual');

    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }

    if (logoAtual) {
        logoAtual.src = '';
        logoAtual.style.display = 'none';
    }

    if (previewVazio) {
        previewVazio.style.display = 'flex';
    }
}

function normalizarTelefone(telefone) {
    return String(telefone || '').replace(/\D/g, '');
}

// ==================== PERFIL ====================

async function carregarPerfil() {
    try {
        const { data: { session }, error: sessionError } =
            await _supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.href = '/index.html';
            return;
        }

        const { data, error } = await _supabase
            .from('perfis')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Erro ao carregar perfil.');
            return;
        }

        if (!data) {
            alert('Perfil não encontrado. Faça login novamente.');
            return;
        }

        setValor('nome', data.nome);
        setValor('nome_empresa', data.nome_empresa);
        setValor('telefone_empresa', data.telefone_empresa);
        setValor('endereco_empresa', data.endereco_empresa);
        setValor('cnpj_empresa', data.cnpj_empresa);
        setValor('foto_url', data.foto_url);

        mostrarPreviewLogo(data.foto_url);

        localStorage.setItem('usuario_nome', data.nome || data.nome_empresa || session.user.email.split('@')[0]);
        localStorage.setItem('usuario_plano', data.plano || 'gratis');

        if (data.foto_url) {
            localStorage.setItem('foto_url', data.foto_url);
        }

    } catch (err) {
        console.error('Erro inesperado ao carregar perfil:', err);
        alert('Erro inesperado ao carregar perfil.');
    }
}

async function salvarPerfil(event) {
    event.preventDefault();

    try {
        const { data: { session }, error: sessionError } =
            await _supabase.auth.getSession();

        if (sessionError || !session) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/index.html';
            return;
        }

        const nome = getValor('nome');
        const nomeEmpresa = getValor('nome_empresa');
        const telefoneEmpresa = getValor('telefone_empresa');

        if (!nome) {
            alert('Informe seu nome.');
            return;
        }

        if (!nomeEmpresa) {
            alert('Informe o nome da empresa.');
            return;
        }

        if (!telefoneEmpresa) {
            alert('Informe o WhatsApp da empresa.');
            return;
        }

        const payload = {
            nome: nome,
            nome_empresa: nomeEmpresa,
            telefone_empresa: telefoneEmpresa,
            endereco_empresa: getValor('endereco_empresa'),
            cnpj_empresa: getValor('cnpj_empresa'),
            foto_url: getValor('foto_url'),
            atualizado_em: new Date().toISOString()
        };

        const { error } = await _supabase
            .from('perfis')
            .update(payload)
            .eq('id', session.user.id);

        if (error) {
            console.error('Erro ao salvar perfil:', error);
            alert('Erro ao salvar perfil: ' + error.message);
            return;
        }

        localStorage.setItem('usuario_nome', payload.nome || payload.nome_empresa);
        localStorage.setItem('nome_empresa', payload.nome_empresa);
        localStorage.setItem('telefone_empresa', payload.telefone_empresa);
        localStorage.setItem('endereco_empresa', payload.endereco_empresa);
        localStorage.setItem('cnpj_empresa', payload.cnpj_empresa);

        if (payload.foto_url) {
            localStorage.setItem('foto_url', payload.foto_url);
        }

        if (typeof carregarMenu === 'function') {
            await carregarMenu(session);
        }

        alert('Perfil atualizado com sucesso!');

    } catch (err) {
        console.error('Erro inesperado ao salvar perfil:', err);
        alert('Erro inesperado ao salvar perfil.');
    }
}

// ==================== UPLOAD DA LOGO ====================

function configurarUploadLogo() {
    const logoInput = pegarElemento('logo_file');

    if (!logoInput) return;

    logoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        await enviarLogoEmpresa(file);

        event.target.value = '';
    });
}

async function enviarLogoEmpresa(file) {
    try {
        const { data: { session }, error: sessionError } =
            await _supabase.auth.getSession();

        if (sessionError || !session) {
            alert('Sessão expirada. Faça login novamente.');
            return null;
        }

        const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];

        if (!tiposPermitidos.includes(file.type)) {
            alert('Formato inválido. Use PNG, JPG ou JPEG.');
            return null;
        }

        if (file.size > 500 * 1024) {
            alert('A imagem deve ter no máximo 500KB.');
            return null;
        }

        const extensao = file.name.split('.').pop().toLowerCase();

        // IMPORTANTE:
        // A policy do Storage espera a pasta com o ID do usuário.
        // Exemplo: logos/USER_ID/logo.png
        const caminhoArquivo = `${session.user.id}/logo.${extensao}`;

        const { error: uploadError } = await _supabase.storage
            .from('logos')
            .upload(caminhoArquivo, file, {
                upsert: true,
                contentType: file.type,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error('Erro ao enviar logo:', uploadError);
            alert('Erro ao enviar logo: ' + uploadError.message);
            return null;
        }

        const { data: publicUrlData } = _supabase.storage
            .from('logos')
            .getPublicUrl(caminhoArquivo);

        const logoUrl = publicUrlData.publicUrl;

        const { error: perfilError } = await _supabase
            .from('perfis')
            .update({
                foto_url: logoUrl,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', session.user.id);

        if (perfilError) {
            console.error('Erro ao salvar URL da logo no perfil:', perfilError);
            alert('A logo foi enviada, mas houve erro ao salvar no perfil.');
            return null;
        }

        setValor('foto_url', logoUrl);
        mostrarPreviewLogo(logoUrl);

        localStorage.setItem('foto_url', logoUrl);

        if (typeof carregarMenu === 'function') {
            await carregarMenu(session);
        }

        alert('Logo salva com sucesso!');
        return logoUrl;

    } catch (err) {
        console.error('Erro inesperado ao enviar logo:', err);
        alert('Erro inesperado ao enviar logo.');
        return null;
    }
}

async function removerLogoEmpresa() {
    const confirmar = confirm('Deseja remover a logo da empresa?');

    if (!confirmar) return;

    try {
        const { data: { session }, error: sessionError } =
            await _supabase.auth.getSession();

        if (sessionError || !session) {
            alert('Sessão expirada.');
            return;
        }

        const fotoUrlAtual = getValor('foto_url');

        // Remove do perfil primeiro.
        const { error: perfilError } = await _supabase
            .from('perfis')
            .update({
                foto_url: '',
                atualizado_em: new Date().toISOString()
            })
            .eq('id', session.user.id);

        if (perfilError) {
            console.error('Erro ao remover logo do perfil:', perfilError);
            alert('Erro ao remover logo.');
            return;
        }

        // Tenta remover arquivos comuns da pasta do usuário.
        // Se não existir, não tem problema.
        await _supabase.storage
            .from('logos')
            .remove([
                `${session.user.id}/logo.png`,
                `${session.user.id}/logo.jpg`,
                `${session.user.id}/logo.jpeg`
            ]);

        setValor('foto_url', '');
        limparPreviewLogo();

        localStorage.removeItem('foto_url');

        if (typeof carregarMenu === 'function') {
            await carregarMenu(session);
        }

        alert('Logo removida com sucesso.');

    } catch (err) {
        console.error('Erro inesperado ao remover logo:', err);
        alert('Erro inesperado ao remover logo.');
    }
}

// Mantém compatibilidade com botões HTML antigos, se existirem.
window.removerLogoEmpresa = removerLogoEmpresa;

// ==================== MODAL DE SENHA ====================

function configurarModalSenha() {
    const modal = pegarElemento('modal-senha');

    if (!modal) return;

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModalSenha();
        }
    });
}

function abrirModalSenha() {
    const modal = pegarElemento('modal-senha');

    if (!modal) {
        alert('Modal de senha não encontrado no HTML.');
        return;
    }

    setValor('senha_atual', '');
    setValor('nova_senha', '');
    setValor('confirmar_senha', '');

    modal.style.display = 'flex';
}

function fecharModalSenha() {
    const modal = pegarElemento('modal-senha');

    if (modal) {
        modal.style.display = 'none';
    }

    setValor('senha_atual', '');
    setValor('nova_senha', '');
    setValor('confirmar_senha', '');
}

async function alterarSenha() {
    const senhaAtual = getValor('senha_atual');
    const novaSenha = getValor('nova_senha');
    const confirmarSenha = getValor('confirmar_senha');

    if (!senhaAtual) {
        alert('Digite sua senha atual.');
        return;
    }

    if (!novaSenha) {
        alert('Digite a nova senha.');
        return;
    }

    if (novaSenha.length < 6) {
        alert('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const { data: { session }, error: sessionError } =
            await _supabase.auth.getSession();

        if (sessionError || !session) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/index.html';
            return;
        }

        const email = session.user.email;

        // Reautentica com a senha atual antes de permitir alterar.
        const { error: loginError } =
            await _supabase.auth.signInWithPassword({
                email: email,
                password: senhaAtual
            });

        if (loginError) {
            console.error('Senha atual inválida:', loginError);
            alert('Senha atual incorreta.');
            return;
        }

        const { error: updateError } =
            await _supabase.auth.updateUser({
                password: novaSenha
            });

        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            alert(updateError.message);
            return;
        }

        fecharModalSenha();
        alert('Senha alterada com sucesso!');

    } catch (err) {
        console.error('Erro inesperado ao alterar senha:', err);
        alert('Erro inesperado ao alterar senha.');
    }
}

// Disponibiliza funções para onclick do HTML.
window.abrirModalSenha = abrirModalSenha;
window.fecharModalSenha = fecharModalSenha;
window.alterarSenha = alterarSenha;

// ==================== ORÇAMENTOS NO PAINEL, SE EXISTIR ====================

let abaAtualPainel = 'pendentes';

async function carregarOrcamentos() {
    const lista = pegarElemento('lista-painel');

    if (!lista) return;

    lista.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    try {
        const response = await fetch(`/admin/orcamentos/${abaAtualPainel}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar orçamentos.');
        }

        const orcamentos = await response.json();

        lista.innerHTML = '';

        if (!orcamentos.length) {
            lista.innerHTML =
                '<tr><td colspan="5">Nenhum orçamento encontrado.</td></tr>';
            return;
        }

        orcamentos.forEach(orc => {
            lista.innerHTML += `
                <tr>
                    <td><strong>${orc.cliente_nome || 'Não informado'}</strong></td>
                    <td>${orc.cliente_whatsapp || 'Não informado'}</td>
                    <td>${orc.consultor || 'Sistema'}</td>
                    <td>R$ ${Number(orc.total || 0).toFixed(2)}</td>
                    <td>
                        <span class="status status-${orc.status || 'pendente'}">
                            ${orc.status || 'pendente'}
                        </span>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Erro ao carregar orçamentos no painel:', err);

        lista.innerHTML =
            '<tr><td colspan="5" style="color:red">Erro ao carregar dados.</td></tr>';
    }
}

// ==================== COMPATIBILIDADE GLOBAL ====================

window.carregarPerfil = carregarPerfil;
window.salvarPerfil = salvarPerfil;
window.configurarUploadLogo = configurarUploadLogo;
window.enviarLogoEmpresa = enviarLogoEmpresa;
window.carregarOrcamentos = carregarOrcamentos;