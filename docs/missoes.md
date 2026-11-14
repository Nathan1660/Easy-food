# Respostas das missões EasyFood

## Missão 1 — Cadastro de restaurantes

O cliente envia nome, categoria e avaliação opcional em JSON para `POST /restaurants`. O Express interpreta o corpo, o controller valida a entrada e o service cadastra o restaurante. Na primeira versão, a decisão foi acrescentar o endpoint ao servidor existente e guardar os registros em um array. A rota e o fluxo de escrita eram novos, e o armazenamento continuava no processo Node.js. Usar PostgreSQL desde o início teria preservado os dados, ao custo de configurar um banco antes de validar o fluxo. A [decisão inicial](adr/ADR-001-armazenar-restaurantes-em-memoria.md) descreve os trade-offs.

## Missões 2 e 3 — Persistência

Um array é recriado ao iniciar o Node.js, por isso um cadastro feito na versão em memória desaparece com a reinicialização. O PostgreSQL conserva o registro e representa os relacionamentos entre usuários, restaurantes e pratos com chaves estrangeiras. O Prisma fornece o cliente de acesso e as migrações do schema. A listagem chama `findMany` e o cadastro chama `create`. O banco indisponível impede essas operações e a API responde com erro 500. A arquitetura inclui um novo componente, o PostgreSQL, e uma conexão de rede gerenciada pelo Prisma. O custo adicional envolve configuração, migrações, disponibilidade e backups. A [decisão de persistência](adr/ADR-002-persistencia-com-postgresql.md) registra as alternativas.

## Missão 4 — Camadas e autenticação

`server.js` inicia a escuta HTTP. `app.js` configura o Express e registra as rotas. Routes mapeiam métodos e caminhos e aplicam os middlewares. Controllers interpretam a entrada e devolvem o status e a resposta. Services executam regras de negócio, podem ser chamados fora de HTTP e usam o Prisma por meio da camada de banco. Assim as rotas ficam livres de consultas ao banco. Separar as responsabilidades facilita localizar e testar mudanças, com mais arquivos e chamadas para acompanhar. A reorganização preserva os endpoints de restaurante. A Atividade 5 introduz a exigência de JWT no cadastro.

| Alternativa | Implicação para o EasyFood |
| --- | --- |
| JWT emitido pela API | Reaproveita o módulo local e a tabela de usuários. O projeto gerencia hashes de senha, segredo, expiração e eventual revogação. |
| Amazon Cognito | Delega a gestão de identidade e emissão dos tokens. Requer configurar o serviço, integrar o cliente e validar os tokens emitidos. [Documentação do Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-how-to-authenticate.html) |
| Login com Google | Permite autenticar com a conta Google via OpenID Connect. Requer configurar credenciais e redirecionamento, validar o token de identidade e vinculá-lo à conta local. [Documentação do Google](https://developers.google.com/identity/openid-connect/openid-connect) |
| Sessão mantida no servidor | Facilita invalidar sessões pelo servidor. Requer armazenamento de sessões e um identificador enviado pelo cliente. |

A EasyFood usa JWT local com validade de um dia e bcrypt para o hash das senhas. Essa escolha encaixa no monólito acadêmico e permite estudar emissão e validação de tokens com a infraestrutura existente.

## Atividade 7 — Cardápio e imagens

A relação é de um restaurante para vários pratos. Cada prato pertence a um restaurante, e o módulo `dishes` reutiliza as camadas e o middleware JWT. O dono do restaurante gerencia o cardápio e a consulta é pública. Uma falha no upload preserva o prato e permite nova tentativa. Consulte a [decisão de processamento](adr/ADR-003-processamento-de-imagens.md).

### Comparação de imagens

| Versão | Formato | Dimensões | Tamanho |
| --- | --- | --- | --- |
| Original de teste | PNG | 1600 × 1000 px | 24.099 bytes |
| Otimizada | WebP | 800 × 500 px | 816 bytes |

O arquivo de teste, gerado com uma cor sólida, ficou 96,6% menor. O redimensionamento manteve a proporção, e a conversão para WebP reduziu o volume transferido ao abrir o cardápio. A economia varia com o conteúdo e com o nível de compressão do original.

## Validação da versão atual

As seis migrações foram aplicadas em um PostgreSQL de teste. O restaurante permaneceu disponível em dois processos consecutivos da API, e o Prisma Studio respondeu com HTTP 200. Os testes também confirmaram o cadastro de usuários com hash bcrypt, login, proteção por JWT, autorização do proprietário, upload, consulta pública e remoção das imagens.

Foram verificadas as duas chamadas ao serviço de e-mail com destinatários e assuntos distintos. Em ambiente sem credenciais, ambas falharam e o restaurante permaneceu cadastrado. A entrega real depende de uma chave MailerSend e de um remetente verificado.
