# Ads — LoL Match Story

Monetização principal preparada para anúncios.

## Regras
- nunca inserir anúncio entre o clique de busca e o carregamento da história;
- evitar anúncios próximos a botões para impedir cliques acidentais;
- reservar slots depois da experiência principal;
- layout não pode saltar quando o anúncio carregar;
- anúncio deve ser identificado;
- preservar legibilidade e estética cinematográfica.

O MVP já possui um slot reservado após o card principal.


## Regras de layout e consentimento
- reservar altura fixa para cada slot para evitar CLS;
- nunca posicionar anúncio encostado nos botões de busca, download ou compartilhamento;
- mobile deve manter anúncio fora da timeline crítica;
- não ativar cookies/trackers de publicidade antes do mecanismo de consentimento exigido pelo provedor;
- o produto pode funcionar integralmente sem anúncios carregados.


## Implementação atual
- `ads-config.js` centraliza `publisherId` e IDs de slots.
- `ads.js` só carrega o provedor quando existe um `ca-pub-*`, existe ao menos um slot configurado e o usuário aceitou o carregamento.
- Sem configuração, nenhum banner de consentimento é exibido e nenhum script externo de anúncios é carregado.
- A escolha fica armazenada localmente em `lms-ads-consent`.
- Para ativar, preencher `publisherId` e `slots.story` em `ads-config.js`.
