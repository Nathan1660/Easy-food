# EasyFood API

API de restaurantes e cardápios com Express, Prisma e PostgreSQL. As operações de escrita usam JWT. O processamento de imagens é feito na própria API.

## Executar localmente

1. Crie um banco PostgreSQL chamado `easyfood`.
2. Copie `.env.example` para `.env`, configure `DATABASE_URL` e gere o valor de `JWT_SECRET` com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Instale as dependências, aplique as migrações e inicie o servidor.

   ```sh
   npm ci
   npx prisma migrate deploy
   npx prisma generate
   npm start
   ```

A API escuta em `http://localhost:3000`. Use `npx prisma studio` para consultar os registros. Para carregar os três restaurantes de exemplo, cadastre um usuário e execute `node prisma/seed.js EMAIL_DO_USUARIO_CADASTRADO`.

Para testar as notificações, configure `EMAIL_API_KEY` e `EMAIL_FROM` com uma chave MailerSend e um remetente verificado. O aviso de boas-vindas usa o e-mail da conta que cadastrou o restaurante. Configure `COMERCIAL_EMAIL` para receber também o aviso comercial. O cadastro é persistido antes das tentativas de envio.

## Endpoints

| Método e rota | Acesso |
| --- | --- |
| `POST /auth/register` | Público |
| `POST /auth/login` | Público |
| GET /auth/me | JWT |
| POST /auth/me/image | JWT da própria conta |
| `GET /restaurants` | Público |
| `POST /restaurants` | JWT |
| `GET /restaurants/:restaurantId/dishes` | Público |
| `GET /dishes/:dishId` | Público |
| `POST /restaurants/:restaurantId/dishes` | Proprietário |
| `PUT /dishes/:dishId` | Proprietário |
| `DELETE /dishes/:dishId` | Proprietário |
| `POST /dishes/:dishId/image` | Proprietário |
| `GET /uploads/dishes/:filename` | Público |

## Testar o fluxo no Postman

1. Cadastre-se em `POST /auth/register` com `name`, `email` e `password`. Envie o mesmo e-mail e senha para `POST /auth/login`. Use `Authorization: Bearer SEU_TOKEN` nas rotas protegidas.
2. Envie `{"name":"Cantina Roma","category":"Italiana","rating":4.5}` para `POST /restaurants` e copie o ID. Reinicie o servidor e consulte `GET /restaurants` para conferir a persistência.
3. Envie `{"name":"Pizza Margherita","description":"Tomate, queijo e manjericão","price":49.9}` para `POST /restaurants/:restaurantId/dishes`. O retorno inclui o ID do prato e `imageUrl: null`. A categoria do prato é opcional.
4. Envie a imagem para `POST /dishes/:dishId/image` como `form-data`. Crie o campo `image` com tipo File e deixe o Postman montar o cabeçalho multipart. A API aceita JPEG, PNG e WebP de até 5 MB.
5. Abra o caminho retornado em `imageUrl` no navegador, usando o mesmo host da API. O arquivo é salvo como WebP em `uploads/dishes/`, com até 800 pixels de largura.
6. Repita o envio com um arquivo inválido, sem arquivo e com um arquivo acima de 5 MB. Espere respectivamente `400`, `400` e `413`. Consulte o prato para confirmar que ele continua cadastrado.
7. Para simular falha no e-mail, execute a API local sem a configuração do MailerSend. Confirme que o cadastro retorna `201` e que o restaurante aparece na consulta.

Para enviar a foto de perfil, use o campo multipart `image` em `POST /auth/me/image` com seu JWT. Consulte `GET /auth/me` para recuperar `user.imageUrl` e abra o caminho no mesmo host da API.

Consulte a [análise da Atividade 8](docs/atividade-8.md) e as [respostas das missões](docs/missoes.md) e os [registros de decisões arquiteturais](docs/adr/).
