# Correções aplicadas em `painel.html`

- removido o conflito entre o atributo `hidden` e `display: block`;
- CSS do painel isolado em `painel.css`;
- estilos de botões limitados ao painel e aos seus modais;
- indicadores usam estado de carregamento em vez de apresentar zero prematuramente;
- atalhos usam SVG acessível em vez de letras provisórias;
- modais receberam botão de fechar, Escape, focus trap, restauração de foco e bloqueio de rolagem;
- campos receberam limites, autocomplete, inputmode e validação de arquivo;
- senha passou a indicar mínimo de 8 caracteres na interface;
- módulos opcionais são ignorados quando seus elementos não existem;
- erros de módulos opcionais são isolados para não derrubar o painel principal;
- área comercial de planos é recolhida para usuários com plano pago;
- zona de perigo foi movida para uma seção avançada recolhível;
- incluído suporte a `prefers-reduced-motion`.

## Verificação manual recomendada

1. abrir `/painel.html` autenticado e confirmar que o loading desaparece;
2. abrir sem sessão e confirmar redirecionamento para o login;
3. testar edição de perfil, senha, exclusão e Pix com mouse e teclado;
4. validar layout em 375 px, 768 px e desktop;
5. confirmar que os KPIs e últimos orçamentos carregam mesmo se um módulo opcional falhar.
