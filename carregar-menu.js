async function carregarMenu(sessionRecebida = null) {
    const headerContainer = document.getElementById('header-container');

    if (!headerContainer) {
        console.error('Erro: #header-container não encontrado.');
        return;
    }

    if (!window._supabase) {
        console.error('Erro: _supabase ainda não existe.');
        return;
    }

    try {
        let session = sessionRecebida;

        if (!session) {
            const { data, error } = await _supabase.auth.getSession();

            if (error) {
                console.error('Erro ao buscar sessão:', error);
                return;
            }

            session = data.session;
        }

        if (!session) {
            headerContainer.innerHTML = '';
            headerContainer.style.display = 'none';
            console.log('Menu oculto: sem sessão.');
            return;
        }

        const response = await fetch('/header.html');

        if (!response.ok) {
            console.error('Erro ao carregar header.html:', response.status);
            return;
        }

        const html = await response.text();

        headerContainer.innerHTML = html;
        headerContainer.style.display = 'block';

        let nomeFinal =
            localStorage.getItem('usuario_nome') ||
            session.user.email.split('@')[0];

        const { data: perfil, error: perfilError } = await _supabase
            .from('perfis')
            .select('nome, nome_empresa, foto_url')
            .eq('id', session.user.id)
            .maybeSingle();

        if (perfilError) {
            console.warn('Erro ao buscar perfil para o menu:', perfilError);
        }

        if (perfil) {
            nomeFinal =
                perfil.nome ||
                perfil.nome_empresa ||
                nomeFinal;

            localStorage.setItem('usuario_nome', nomeFinal);
        }

        const saudacao = document.getElementById('usuario-saudacao');

        if (saudacao) {
            saudacao.innerText = `Olá, ${nomeFinal}`;
        }

        const logoEmpresa = document.getElementById('logo-empresa');

        if (logoEmpresa && perfil?.foto_url) {
            logoEmpresa.src = perfil.foto_url;
            logoEmpresa.style.display = 'block';
        }

        console.log('Menu carregado com sucesso.');

    } catch (err) {
        console.error('Erro geral ao carregar menu:', err);
    }
}

window.carregarMenu = carregarMenu;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarMenu();

    if (window._supabase) {
        _supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                const headerContainer = document.getElementById('header-container');
                if (headerContainer) {
                    headerContainer.innerHTML = '';
                    headerContainer.style.display = 'none';
                }
                return;
            }

            await carregarMenu(session);
        });
    }
});