# Dados gerais do campus — regras incorporadas

## Fonte e campos
O primeiro formulário foi reconstruído a partir do PDF fornecido em 08/10/2026. Campos:
- Nome do campus, sigla e tipologia: cadastro institucional protegido.
- Quantidade de docentes efetivos, TAEs e docentes substitutos: inteiros não negativos.
- Planilha de carga horária docente em disciplinas dos cursos regulares (subsequente, integrado e graduação): arquivo .xlsx ou .xls.
- Links para calendários dos cursos técnicos integrados, técnicos subsequentes e superiores de graduação: endereços completos HTTP/HTTPS.

Todos os campos editáveis exigidos no formulário original são conferidos na validação final. Rascunhos podem ter calendários e anexo pendentes; os quantitativos devem permanecer inteiros não negativos. O endereço do modelo de planilha não está exposto no PDF e não foi inventado. Enviar o endereço oficial para ativar esse link. Campos das demais dimensões continuam demonstrativos até o envio dos respectivos formulários.

Barreiras está pré-preenchido com BAR, 90/60 e os três endereços mostrados no PDF. Os números zero reproduzem a tela, sem serem tratados como quantitativos reais confirmados. As outras unidades têm quantitativos ilustrativos, calendários vazios e tipologia não informada. Os usuários são instruídos a conferir/complementar os dados.

## Escopo e permissões
Dados gerais pertencem ao campus e ao período de referência, não ao curso. Dois cursos do mesmo campus/período consultam o mesmo registro.

| Operação | Administrador | Gestor da unidade | Coordenador | Gestor PROEN |
|---|---|---|---|---|
| Consultar | Todos | Sua unidade | Unidade do curso | Todos |
| Complementar, salvar, validar | Todos | Sua unidade | Não | Não |
| Editar após validar | Todos | Sua unidade | Não | Não |
| Alterar nome, sigla ou tipologia | Sim | Não | Não | Não |

Visualizador permanece no painel. A vinculação institucional futura deve ser definida no servidor, não pelo usuário no login.

## Ciclo do registro
1. **Aguardando conferência**: dados iniciais carregados; não validados.
2. **Rascunho**: informações complementadas e salvas; campos ainda podem estar pendentes.
3. **Validado**: todos os campos exigidos conferidos, planilha anexada e confirmação expressa realizada.
4. **Editar dados**: reabre a versão validada sem alterar o registro até que o usuário salve.
5. **Salvar rascunho após validação**: substitui os dados vigentes, mantém a referência à última validação e marca a versão atual como pendente de revalidação.
6. **Validar novamente**: substitui o registro vigente e registra nova data, responsável e versão validada.

Cada gravação incrementa a versão. Nome, sigla e tipologia têm atualização administrativa separada, com justificativa e log local. Alterar a identificação não muda a chave interna dos registros, os vínculos de cursos ou a contagem de preenchimento. No protótipo, responsáveis são representados pelo perfil e campus; na implementação real, usar o identificador único do usuário autenticado.

## Persistência atual
Este pacote continua sendo um protótipo sem banco remoto. Registros atuais estão em `localStorage` na chave `diag-campusRecords`, indexados por campus e ano. A planilha inteira fica em IndexedDB (`diag-campus-files`), e o registro guarda sua referência, nome e tamanho. O JSON exportado contém metadados, não os bytes da planilha; use **Baixar planilha salva** para recuperar o anexo.

As outras duas chaves são `diag-campusIdentities` e `diag-campusIdentityEvents`. A identificação é independente dos registros por ano. O estado validado só muda quando o registro é salvo; cancelar a confirmação preserva o estado anterior. Trocar campus/período ou fechar a página com alterações pendentes gera aviso. A detecção de versão reduz sobrescritas entre abas no protótipo; atomicidade entre usuários será responsabilidade do banco real. Arquivos antigos podem permanecer no armazenamento local; a referência vigente aponta para o último anexo salvo.

## Contrato para o banco de dados real
Recomenda-se manter duas entidades principais e uma trilha administrativa:

| Entidade | Chave e campos relevantes | Regra |
|---|---|---|
| `campus` | `id` estável; `nome`, `sigla`, `tipologia`; metadados de atualização | Somente administrador altera identificação |
| `campus_dados_gerais` | Chave única `(campus_id, periodo_referencia)`; quantitativos; URLs; `anexo_id`; `status`; `versao`; `atualizado_em`, `atualizado_por`; `validado_em`, `validado_por`, `versao_validada` | Um registro vigente por campus/período, atualizado a cada gravação |
| `anexo` | Identificador; caminho privado; nome; tamanho; tipo; proprietário; campus/período | Arquivo em armazenamento privado, acesso restrito ao mesmo escopo |
| `campus_identificacao_log` | Campus, usuário, data, valores anteriores/novos e justificativa | Trilha das alterações administrativas |
| `usuario_vinculo` | Usuário autenticado, papel, campus e, quando aplicável, curso | Concede escopo; editável por administradores autorizados |

O serviço deve obter papel e vínculo da autenticação e do banco, nunca aceitar privilégios declarados no corpo da requisição. A API de atualização dos dados gerais deve aceitar apenas quantitativos, URLs, anexo e ação; campos de identificação não pertencem a essa operação.

Proposta de operação: `salvarDadosGerais(campus_id, periodo, versao_esperada, dados, anexo_id, acao)`.
- Conferir autenticação, papel e vínculo do campus.
- Validar números, endereços, propriedade e disponibilidade do anexo.
- Quando a ação for validar, exigir o instrumento completo e a confirmação de conferência.
- Executar atualização em transação com condição `versao = versao_esperada`; incrementar a versão e gravar os metadados. Zero linhas atualizadas significa conflito: devolver a versão vigente e solicitar nova conferência.
- Manter apenas a última versão como registro vigente; não criar um novo diagnóstico por edição ou por curso. Histórico adicional pode ser mantido em tabela de auditoria, conforme política institucional.
- Garantir a chave única `(campus_id, periodo_referencia)` para impedir registros duplicados.
- Aplicar autorização na API e no banco/RLS. Colunas administrativas e vínculos não podem ser atualizados por gestores, mesmo em requisições construídas manualmente.
- Disponibilizar anexos por URL assinada de curta duração ou endpoint autenticado; impedir acesso público. Verificar conteúdo/formato da planilha e limitar tamanho no servidor. Fazer limpeza dos anexos substituídos conforme retenção institucional.

Essas entidades e regras são especificação para a integração futura; nenhuma migração ou conexão ao banco é executada por este pacote.

## Testes incluídos
Execute `node tests/campus-model.test.cjs` na pasta extraída. O teste verifica permissões, identificação exclusiva do administrador, rascunho, validação, edição/revalidação, versão esperada, quantitativos, URLs e metadados de anexos. Não verifica interface visual, IndexedDB ou segurança de produção.

## Roteiro de homologação
1. Acesse como gestor de campus e selecione Barreiras.
2. Abra Dados Gerais e confirme que nome, sigla e tipologia não podem ser editados.
3. Complementar os quantitativos, anexar uma planilha e conferir os calendários.
4. Salvar rascunho, recarregar a página e baixar o anexo salvo.
5. Marcar a confirmação, clicar em validar e cancelar no diálogo: os dados anteriores devem permanecer.
6. Confirmar a validação: a versão atual deve aparecer como validada, em consulta.
7. Reabrir, alterar um quantitativo, salvar rascunho: a versão vigente deve mudar e indicar revalidação pendente.
8. Validar novamente: metadados de validação passam à nova versão.
9. Consultar dois cursos de Salvador no mesmo ano: Dados Gerais deve refletir o mesmo registro compartilhado.
10. Trocar para coordenador: o formulário deve ser somente consulta.
11. Acessar como administrador e alterar identificação com justificativa.
12. Em duas abas, salvar em uma e tentar salvar a versão antiga na outra: a segunda deve sinalizar conflito.

A versão atual mantém o período como ano (2025/2026). Caso o diagnóstico seja semestral ou contínuo, ajustar a chave antes de integrar o banco. Não há opção de dispensar calendários para níveis não ofertados: o PDF os apresenta como obrigatórios; esse tratamento poderá ser definido na validação institucional do instrumento.

Teste adicional: `node tests/campus-interface-smoke.test.cjs` executa os três scripts com um DOM mínimo para conferir controles protegidos, consulta por perfil e o caminho de rascunho/validação. IndexedDB é substituído por uma função de teste; esse teste não é evidência de funcionamento do armazenamento de arquivos nem do layout em um navegador real. Verificação visual continua pendente, pois não há navegador instalado no ambiente de geração.
