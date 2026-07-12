(function aplicarIconesOficiaisFS(){
  const versao='20260712-icons-2';
  const head=document.head;
  if(!head)return;

  const removerSeletores=[
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="manifest"]'
  ];
  head.querySelectorAll(removerSeletores.join(',')).forEach(el=>el.remove());

  const adicionar=(rel,href,type,sizes)=>{
    const link=document.createElement('link');
    link.rel=rel;
    link.href=`${href}?v=${versao}`;
    if(type)link.type=type;
    if(sizes)link.sizes=sizes;
    head.appendChild(link);
  };

  adicionar('icon','/assets/images/favicon.ico','image/x-icon');
  adicionar('icon','/assets/images/favicon-16.png','image/png','16x16');
  adicionar('icon','/assets/images/favicon-32.png','image/png','32x32');
  adicionar('icon','/assets/images/favicon-48.png','image/png','48x48');
  adicionar('icon','/assets/images/favicon-64.png','image/png','64x64');
  adicionar('icon','/assets/images/icon-192.png','image/png','192x192');
  adicionar('apple-touch-icon','/assets/images/apple-touch-icon.png','image/png','180x180');
  adicionar('manifest','/manifest.json');

  let meta=head.querySelector('meta[name="theme-color"]');
  if(!meta){meta=document.createElement('meta');meta.name='theme-color';head.appendChild(meta)}
  meta.content='#07111f';
})();
